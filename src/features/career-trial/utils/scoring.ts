import * as THREE from 'three'

export type TrialScoreBreakdown = {
  overall: number
  accuracy: number
  reaction: number
  stability: number
}

type ScoreInput = {
  dropDistance: number
  targetRadius: number
  reactionTimeMs: number
  jitterAverage: number
}

function toPercent(value: number) {
  return Math.round(THREE.MathUtils.clamp(value, 0, 100))
}

export function calculateTrialScores(input: ScoreInput): TrialScoreBreakdown {
  const normalizedAccuracy = 1 - THREE.MathUtils.clamp(input.dropDistance / input.targetRadius, 0, 1)
  const accuracy = toPercent(normalizedAccuracy * 100)

  // Best around <=12s, acceptable up to ~35s.
  const reactionRaw = THREE.MathUtils.mapLinear(input.reactionTimeMs, 12000, 35000, 100, 35)
  const reaction = toPercent(reactionRaw)

  // Jitter average around 0.001-0.004 is very stable; >0.02 is unstable.
  const stabilityRaw = THREE.MathUtils.mapLinear(input.jitterAverage, 0.0015, 0.02, 100, 25)
  const stability = toPercent(stabilityRaw)

  const overall = toPercent(accuracy * 0.45 + reaction * 0.3 + stability * 0.25)

  return { overall, accuracy, reaction, stability }
}

