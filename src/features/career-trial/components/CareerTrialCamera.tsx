import { useEffect, type RefObject } from 'react'
import type { HandsFrame } from '../types'

type CareerTrialCameraProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  isReady: boolean
  error: string | null
  frame: HandsFrame | null
  onFallbackNeeded: (reason: string) => void
}

export function CareerTrialCamera({
  videoRef,
  isReady,
  error,
  frame,
  onFallbackNeeded,
}: CareerTrialCameraProps) {
  useEffect(() => {
    if (error) {
      onFallbackNeeded(error)
    }
  }, [error, onFallbackNeeded])

  return (
    <section className="ct-card">
      <header className="ct-card-head">
        <h2>Career Trial Camera</h2>
        <p>Prompt 1.1: Webcam + MediaPipe Hands bootstrapped.</p>
      </header>

      <div className="ct-video-wrap">
        <video ref={videoRef} className="ct-video" autoPlay playsInline muted />
      </div>

      <div className="ct-status">
        <span>MediaPipe: {isReady ? 'Ready' : 'Initializing...'}</span>
        <span>Landmarks detected: {frame?.landmarks.length ?? 0}</span>
      </div>
      {error ? <p className="ct-error">Camera unavailable: {error}</p> : null}
    </section>
  )
}
