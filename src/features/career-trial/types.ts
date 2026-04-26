export type CareerTrialScore = {
  trialName: string
  accuracy: number
  stability: number
  reaction: number
  suggestedDirection: string
}

export type TrialState = 'WAITING' | 'GRABBED' | 'SUCCESS'

export type HandPoint = {
  x: number
  y: number
  z: number
}

export type Handedness = 'Left' | 'Right' | 'Unknown'

export type DetectedHand = {
  handedness: Handedness
  landmarks: HandPoint[]
}

export type HandsFrame = {
  landmarks: HandPoint[]
  hands: DetectedHand[]
  timestamp: number
}

export type GestureState = {
  handDetected: boolean
  isPinching: boolean
  gripStrength: number
  pinchDistance: number
  wristRotation: number
  label: string
}
