import * as THREE from 'three'
import type { GestureState, HandsFrame } from '../types'

function pointDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function remapClamped(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  const t = THREE.MathUtils.clamp((value - inMin) / (inMax - inMin), 0, 1)
  return THREE.MathUtils.lerp(outMin, outMax, t)
}

function getWristRotation(frame: HandsFrame) {
  const indexMcp = frame.landmarks[5]
  const pinkyMcp = frame.landmarks[17]
  const rawAngle = Math.atan2(indexMcp.y - pinkyMcp.y, indexMcp.x - pinkyMcp.x)
  return THREE.MathUtils.clamp(rawAngle, -1.2, 1.2)
}

export function detectGestureState(frame: HandsFrame | null): GestureState {
  if (!frame || frame.landmarks.length < 18) {
    return {
      handDetected: false,
      isPinching: false,
      gripStrength: 0,
      pinchDistance: 0,
      wristRotation: 0,
      label: 'No Hand',
    }
  }

  const thumbTip = frame.landmarks[4]
  const indexTip = frame.landmarks[8]
  const indexMcp = frame.landmarks[5]
  const ringMcp = frame.landmarks[13]

  const pinchDistance = pointDistance(thumbTip, indexTip)
  const palmWidth = pointDistance(indexMcp, ringMcp)

  const normalizedPinch = remapClamped(
    pinchDistance,
    0.02,
    Math.max(0.04, palmWidth * 0.95),
    1,
    0,
  )
  const gripStrength = THREE.MathUtils.clamp(normalizedPinch, 0, 1)
  const isPinching = gripStrength > 0.72
  const wristRotation = getWristRotation(frame)

  const label = isPinching ? 'Hand Detected: Gripping' : 'Hand Detected: Open Hand'

  return {
    handDetected: true,
    isPinching,
    gripStrength,
    pinchDistance,
    wristRotation,
    label,
  }
}
