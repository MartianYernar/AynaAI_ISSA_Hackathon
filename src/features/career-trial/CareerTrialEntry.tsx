import { useMemo, useRef, useState } from 'react'
import { CareerTrialCamera } from './components/CareerTrialCamera'
import { FirstPersonHandsWorkspace } from './components/FirstPersonHandsWorkspace'
import { useMediaPipeHands } from './hooks/useMediaPipeHands'
import { useSmoothedHandsFrame } from './hooks/useSmoothedHandsFrame'
import { detectGestureState } from './utils/gestures'
import { publishCareerTrialScore } from './integrationAdapter'
import type { CareerTrialScore } from './types'
import './career-trial.css'

type CareerTrialEntryProps = {
  onScoreReady?: (score: CareerTrialScore) => void
}

export function CareerTrialEntry({ onScoreReady }: CareerTrialEntryProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [cameraRetryToken, setCameraRetryToken] = useState(0)
  const [skipToQuizMode, setSkipToQuizMode] = useState(false)
  const { isReady, error, frame: rawFrame } = useMediaPipeHands(videoRef, {
    retryToken: cameraRetryToken,
  })
  const frame = useSmoothedHandsFrame(rawFrame)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [score, setScore] = useState<CareerTrialScore | null>(null)

  const isFallbackMode = useMemo(() => Boolean(fallbackReason), [fallbackReason])
  const gestureState = useMemo(() => detectGestureState(frame), [frame])

  return (
    <section className="ct-shell ct-shell-immersive">
      {!isFallbackMode ? (
        <FirstPersonHandsWorkspace
          frame={frame}
          onScoreReady={(finalScore) => {
            setScore(finalScore)
            publishCareerTrialScore(finalScore)
            onScoreReady?.(finalScore)
          }}
        />
      ) : (
        <section className="ct-card ct-paused-card ct-paused-immersive">
          <header className="ct-card-head">
            <h2>Simulation Paused</h2>
            <p>
              Camera access is unavailable. You can retry camera initialization or continue with
              a simplified non-camera flow.
            </p>
          </header>
          <p className="ct-error">{fallbackReason}</p>
          <div className="ct-result-actions">
            <button
              className="ct-button"
              type="button"
              onClick={() => {
                setFallbackReason(null)
                setSkipToQuizMode(false)
                setCameraRetryToken((value) => value + 1)
              }}
            >
              Retry Camera
            </button>
            <button
              className="ct-button ct-button-secondary"
              type="button"
              onClick={() => setSkipToQuizMode(true)}
            >
              Skip to Quiz
            </button>
          </div>
          {skipToQuizMode ? (
            <section className="ct-quiz-mock">
              <h3>Quiz Mode (Mock)</h3>
              <p>
                Camera-less fallback is active. Replace this with the real questionnaire in
                integration.
              </p>
              <button className="ct-button ct-button-secondary" type="button">
                Start Mock Quiz
              </button>
            </section>
          ) : null}
        </section>
      )}

      <section className="ct-status-island ct-status-floating">
        <span className={gestureState.handDetected ? 'ct-badge ok' : 'ct-badge'}>
          Hand: {gestureState.handDetected ? 'Detected' : 'Not Detected'}
        </span>
        <span>{gestureState.label}</span>
        <span>Grip: {(gestureState.gripStrength * 100).toFixed(0)}%</span>
        <span>Wrist Rotation: {gestureState.wristRotation.toFixed(2)} rad</span>
      </section>

      {!isFallbackMode ? (
        <section className="ct-card ct-camera-mini">
          <CareerTrialCamera
            videoRef={videoRef}
            isReady={isReady}
            error={error}
            frame={frame}
            onFallbackNeeded={setFallbackReason}
          />
        </section>
      ) : null}

      <section className="ct-card ct-score-floating">
        <header className="ct-card-head">
          <h2>Integration Payload</h2>
          <p>Auto-published from first-person lab interactions.</p>
        </header>
        <p className="ct-task-state">
          {score
            ? 'Score payload is ready and synced to integration adapter.'
            : 'Perform a pinch-grab and place an object in target to produce score.'}
        </p>
        {score ? <pre className="ct-json">{JSON.stringify(score, null, 2)}</pre> : null}
      </section>
    </section>
  )
}
