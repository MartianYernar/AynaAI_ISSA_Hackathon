import { useEffect, useMemo, useRef, useState } from 'react'
import type { HandsFrame } from '../types'

const DEFAULT_ALPHA = 0.22

export function useSmoothedHandsFrame(frame: HandsFrame | null, alpha = DEFAULT_ALPHA) {
  const [smoothedFrame, setSmoothedFrame] = useState<HandsFrame | null>(null)
  const prevRef = useRef<HandsFrame | null>(null)

  const clampedAlpha = useMemo(() => Math.min(0.9, Math.max(0.05, alpha)), [alpha])

  useEffect(() => {
    if (!frame || frame.landmarks.length === 0) {
      prevRef.current = null
      setSmoothedFrame(null)
      return
    }

    const previous = prevRef.current
    if (!previous || previous.landmarks.length !== frame.landmarks.length) {
      prevRef.current = frame
      setSmoothedFrame(frame)
      return
    }

    const next: HandsFrame = {
      timestamp: frame.timestamp,
      landmarks: frame.landmarks.map((currentPoint, index) => {
        const previousPoint = previous.landmarks[index]
        return {
          x: previousPoint.x + (currentPoint.x - previousPoint.x) * clampedAlpha,
          y: previousPoint.y + (currentPoint.y - previousPoint.y) * clampedAlpha,
          z: previousPoint.z + (currentPoint.z - previousPoint.z) * clampedAlpha,
        }
      }),
      hands: frame.hands.map((hand, handIndex) => {
        const previousHand = previous.hands[handIndex]
        if (!previousHand || previousHand.landmarks.length !== hand.landmarks.length) {
          return hand
        }
        return {
          handedness: hand.handedness,
          landmarks: hand.landmarks.map((currentPoint, landmarkIndex) => {
            const previousPoint = previousHand.landmarks[landmarkIndex]
            return {
              x: previousPoint.x + (currentPoint.x - previousPoint.x) * clampedAlpha,
              y: previousPoint.y + (currentPoint.y - previousPoint.y) * clampedAlpha,
              z: previousPoint.z + (currentPoint.z - previousPoint.z) * clampedAlpha,
            }
          }),
        }
      }),
    }

    prevRef.current = next
    setSmoothedFrame(next)
  }, [clampedAlpha, frame])

  return smoothedFrame
}
