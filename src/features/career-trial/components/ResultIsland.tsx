import type { CareerTrialScore } from '../types'
import type { TrialScoreBreakdown } from '../utils/scoring'

type ResultIslandProps = {
  score: CareerTrialScore
  breakdown: TrialScoreBreakdown
  onFinish: () => void
  onReset: () => void
}

export function ResultIsland({ score, breakdown, onFinish, onReset }: ResultIslandProps) {
  return (
    <section className="ct-result-island">
      <header>
        <h3>Result Island</h3>
        <p>Robotics Engineer Trial Complete</p>
      </header>

      <div className="ct-result-overall">{breakdown.overall}/100</div>

      <div className="ct-result-grid">
        <div>
          <span>Accuracy</span>
          <strong>{breakdown.accuracy}</strong>
        </div>
        <div>
          <span>Speed</span>
          <strong>{breakdown.reaction}</strong>
        </div>
        <div>
          <span>Stability</span>
          <strong>{breakdown.stability}</strong>
        </div>
      </div>

      <p className="ct-result-recommendation">High potential for Robotics Engineering!</p>

      <div className="ct-result-actions">
        <button className="ct-button" type="button" onClick={onFinish}>
          Finish
        </button>
        <button className="ct-button ct-button-secondary" type="button" onClick={onReset}>
          Try Again
        </button>
      </div>

      <pre className="ct-json">{JSON.stringify(score, null, 2)}</pre>
    </section>
  )
}

