import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { Handedness, HandsFrame } from '../types'

type UseMediaPipeHandsOptions = {
  maxNumHands?: number
  modelComplexity?: 0 | 1
  minDetectionConfidence?: number
  minTrackingConfidence?: number
  targetFps?: number
  retryToken?: number
}

type UseMediaPipeHandsResult = {
  isReady: boolean
  error: string | null
  frame: HandsFrame | null
}

const CDN_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
const CAMERA_UTILS_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'
const HANDS_SCRIPT_CDN = `${CDN_ROOT}/hands.js`

type Landmark = { x: number; y: number; z: number }
type HandednessEntry = { label?: string }
type MediaPipeResults = {
  multiHandLandmarks?: Landmark[][]
  multiHandedness?: HandednessEntry[][]
}
type HandsApi = {
  setOptions: (options: Record<string, unknown>) => void
  onResults: (handler: (results: MediaPipeResults) => void) => void
  send: (input: { image: HTMLVideoElement }) => Promise<void>
  close: () => void
}
type CameraApi = { start: () => Promise<void>; stop: () => Promise<void> }

declare global {
  interface Window {
    Hands?: new (args: { locateFile: (file: string) => string }) => HandsApi
    Camera?: new (
      video: HTMLVideoElement,
      options: { onFrame: () => Promise<void>; width: number; height: number },
    ) => CameraApi
  }
}

async function loadScript(src: string) {
  const isHandsScript = src.includes('/hands/')
  const isCameraScript = src.includes('/camera_utils/')
  const constructorAlreadyPresent =
    (isHandsScript && Boolean(window.Hands)) || (isCameraScript && Boolean(window.Camera))

  if (constructorAlreadyPresent) {
    return
  }

  const existingScript = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
  if (existingScript?.dataset.loaded === 'true') return

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    const markLoaded = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    const onError = () => reject(new Error(`Failed to load script: ${src}`))

    script.src = existingScript ? `${src}?retry=${Date.now()}` : src
    script.async = true
    script.onload = markLoaded
    script.onerror = onError
    document.head.appendChild(script)
  })
}

async function ensureMediaPipeGlobals() {
  console.log('[CareerTrial] Loading MediaPipe scripts...')
  await loadScript(HANDS_SCRIPT_CDN)
  await loadScript(CAMERA_UTILS_CDN)
  console.log('[CareerTrial] Script load complete. window.Hands:', Boolean(window.Hands))
  console.log('[CareerTrial] Script load complete. window.Camera:', Boolean(window.Camera))

  if (!window.Hands || !window.Camera) {
    throw new Error('MediaPipe scripts loaded but Hands/Camera constructors are missing.')
  }
}

export function useMediaPipeHands(
  videoRef: RefObject<HTMLVideoElement | null>,
  options: UseMediaPipeHandsOptions = {},
): UseMediaPipeHandsResult {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [frame, setFrame] = useState<HandsFrame | null>(null)

  const cameraRef = useRef<CameraApi | null>(null)
  const handsRef = useRef<HandsApi | null>(null)

  const config = useMemo(
    () => ({
      maxNumHands: options.maxNumHands ?? 1,
      modelComplexity: options.modelComplexity ?? 0,
      minDetectionConfidence: options.minDetectionConfidence ?? 0.6,
      minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
      targetFps: options.targetFps ?? 30,
    }),
    [
      options.maxNumHands,
      options.minDetectionConfidence,
      options.minTrackingConfidence,
      options.modelComplexity,
      options.targetFps,
    ],
  )
  const retryToken = options.retryToken ?? 0

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) {
      setError('Video element is not available.')
      return
    }

    let isCancelled = false
    let rafToken: number | null = null
    let latestFrame: HandsFrame | null = null

    const bootstrap = async () => {
      try {
        setError(null)
        setFrame(null)
        setIsReady(false)
        console.log('[CareerTrial] Bootstrapping MediaPipe Hands...')
        await ensureMediaPipeGlobals()

        console.log('[CareerTrial] Requesting camera stream...')
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 960, height: 540 },
          audio: false,
        })

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        videoElement.srcObject = stream
        await videoElement.play()
        console.log('[CareerTrial] Camera stream ready.')

        const hands = new window.Hands!({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        })
        hands.setOptions(config)
        console.log('[CareerTrial] Hands initialized with options:', config)

        hands.onResults((results: MediaPipeResults) => {
          const allHands = results.multiHandLandmarks ?? []
          if (!allHands.length) {
            latestFrame = null
            if (rafToken == null) {
              rafToken = requestAnimationFrame(() => {
                rafToken = null
                setFrame(null)
              })
            }
            return
          }

          const mappedHands = allHands.map((handLandmarks, index) => {
            const rawLabel = results.multiHandedness?.[index]?.[0]?.label
            const handedness: Handedness =
              rawLabel === 'Left' || rawLabel === 'Right' ? rawLabel : 'Unknown'

            return {
              handedness,
              landmarks: handLandmarks.map(({ x, y, z }) => ({ x, y, z })),
            }
          })
          const firstHand = mappedHands[0]

          latestFrame = {
            landmarks: firstHand.landmarks,
            hands: mappedHands,
            timestamp: performance.now(),
          }
          if (rafToken == null) {
            rafToken = requestAnimationFrame(() => {
              rafToken = null
              if (!isCancelled) {
                setFrame(latestFrame)
              }
            })
          }
        })

        let lastProcessAt = 0
        let isProcessingFrame = false
        const minIntervalMs = 1000 / Math.max(1, config.targetFps)

        const camera = new window.Camera!(videoElement, {
          onFrame: async () => {
            const now = performance.now()
            if (isProcessingFrame || now - lastProcessAt < minIntervalMs) return
            isProcessingFrame = true
            lastProcessAt = now
            try {
              await hands.send({ image: videoElement })
            } finally {
              isProcessingFrame = false
            }
          },
          width: 960,
          height: 540,
        })

        handsRef.current = hands
        cameraRef.current = camera
        await camera.start()
        console.log('[CareerTrial] MediaPipe camera loop started.')
        setIsReady(true)
      } catch (caughtError) {
        console.error('[CareerTrial] MediaPipe setup failed:', caughtError)
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : 'Unable to initialize camera or MediaPipe Hands.'
        setError(message)
      }
    }

    bootstrap()

    return () => {
      isCancelled = true
      setIsReady(false)

      const mediaStream = videoElement.srcObject as MediaStream | null
      mediaStream?.getTracks().forEach((track) => track.stop())
      videoElement.srcObject = null

      cameraRef.current?.stop()
      handsRef.current?.close()
      cameraRef.current = null
      handsRef.current = null
      if (rafToken != null) {
        cancelAnimationFrame(rafToken)
      }
    }
  }, [config, retryToken, videoRef])

  return { isReady, error, frame }
}
