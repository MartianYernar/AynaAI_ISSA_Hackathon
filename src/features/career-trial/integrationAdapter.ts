import type { CareerTrialScore } from './types'

let latestCareerTrialScore: CareerTrialScore | null = null
const listeners = new Set<(score: CareerTrialScore | null) => void>()

export function publishCareerTrialScore(score: CareerTrialScore) {
  latestCareerTrialScore = score
  listeners.forEach((listener) => listener(score))
}

export function getLatestCareerTrialScore() {
  return latestCareerTrialScore
}

export function subscribeCareerTrialScore(
  listener: (score: CareerTrialScore | null) => void,
) {
  listeners.add(listener)
  listener(latestCareerTrialScore)
  return () => listeners.delete(listener)
}

