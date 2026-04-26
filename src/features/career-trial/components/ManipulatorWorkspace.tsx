import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { CareerTrialScore, GestureState, HandsFrame, TrialState } from '../types'
import { calculateTrialScores, type TrialScoreBreakdown } from '../utils/scoring'
import { ResultIsland } from './ResultIsland'

type ManipulatorWorkspaceProps = {
  frame: HandsFrame | null
  gestureState: GestureState
  onFinishScore: (score: CareerTrialScore) => void
}

type ArmRigProps = {
  baseYaw: number
  shoulderPitch: number
  elbowPitch: number
  gripOpen: number
  onEndEffectorUpdate?: (position: THREE.Vector3) => void
}

const OBJECT_START = new THREE.Vector3(0.65, -0.3, 0.25)
const TARGET_CENTER = new THREE.Vector3(-0.75, -0.4, -0.45)
const TARGET_RADIUS = 0.2

function ArmRig({ baseYaw, shoulderPitch, elbowPitch, gripOpen, onEndEffectorUpdate }: ArmRigProps) {
  const baseRef = useRef<THREE.Group>(null)
  const shoulderRef = useRef<THREE.Group>(null)
  const elbowRef = useRef<THREE.Group>(null)
  const leftGripperRef = useRef<THREE.Mesh>(null)
  const rightGripperRef = useRef<THREE.Mesh>(null)
  const endEffectorRef = useRef<THREE.Group>(null)
  const worldPositionBuffer = useRef(new THREE.Vector3())

  useFrame(() => {
    if (!baseRef.current || !shoulderRef.current || !elbowRef.current) return

    baseRef.current.rotation.y = THREE.MathUtils.lerp(baseRef.current.rotation.y, baseYaw, 0.14)
    shoulderRef.current.rotation.z = THREE.MathUtils.lerp(shoulderRef.current.rotation.z, shoulderPitch, 0.14)
    elbowRef.current.rotation.z = THREE.MathUtils.lerp(elbowRef.current.rotation.z, elbowPitch, 0.14)

    if (leftGripperRef.current && rightGripperRef.current) {
      leftGripperRef.current.position.x = THREE.MathUtils.lerp(leftGripperRef.current.position.x, -0.08 - gripOpen, 0.2)
      rightGripperRef.current.position.x = THREE.MathUtils.lerp(rightGripperRef.current.position.x, 0.08 + gripOpen, 0.2)
    }

    if (endEffectorRef.current && onEndEffectorUpdate) {
      endEffectorRef.current.getWorldPosition(worldPositionBuffer.current)
      onEndEffectorUpdate(worldPositionBuffer.current)
    }
  })

  return (
    <group ref={baseRef}>
      <mesh position={[0, -0.38, 0]}>
        <cylinderGeometry args={[0.3, 0.32, 0.18, 32]} />
        <meshStandardMaterial color="#586cff" metalness={0.5} roughness={0.4} />
      </mesh>
      <group ref={shoulderRef} position={[0, -0.22, 0]}>
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[0.17, 0.58, 0.17]} />
          <meshStandardMaterial color="#8f9bff" metalness={0.3} roughness={0.5} />
        </mesh>
        <group ref={elbowRef} position={[0, 0.55, 0]}>
          <mesh position={[0, 0.24, 0]}>
            <boxGeometry args={[0.14, 0.5, 0.14]} />
            <meshStandardMaterial color="#a5adff" metalness={0.25} roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.56, 0]}>
            <sphereGeometry args={[0.09, 24, 24]} />
            <meshStandardMaterial color="#d0d5ff" />
          </mesh>
          <group position={[0, 0.56, 0]}>
            <mesh ref={leftGripperRef} position={[-0.08, 0.07, 0]}>
              <boxGeometry args={[0.04, 0.18, 0.04]} />
              <meshStandardMaterial color="#f4f6ff" />
            </mesh>
            <mesh ref={rightGripperRef} position={[0.08, 0.07, 0]}>
              <boxGeometry args={[0.04, 0.18, 0.04]} />
              <meshStandardMaterial color="#f4f6ff" />
            </mesh>
            <group ref={endEffectorRef} position={[0, 0.16, 0]} />
          </group>
        </group>
      </group>
    </group>
  )
}

type TrialTaskProps = {
  endEffectorRef: MutableRefObject<THREE.Vector3>
  isPinching: boolean
  onTaskStateChange: (state: TrialState) => void
  runId: number
  onSuccessDrop: (dropDistance: number) => void
}

function TrialTaskObjects({ endEffectorRef, isPinching, onTaskStateChange, runId, onSuccessDrop }: TrialTaskProps) {
  const objectRef = useRef<THREE.Mesh>(null)
  const objectPositionRef = useRef(OBJECT_START.clone())
  const taskStateRef = useRef<TrialState>('WAITING')
  const scratch = useRef(new THREE.Vector3())
  const currentRunRef = useRef(runId)

  if (currentRunRef.current !== runId) {
    currentRunRef.current = runId
    taskStateRef.current = 'WAITING'
    objectPositionRef.current.copy(OBJECT_START)
  }

  useFrame(() => {
    const object = objectRef.current
    if (!object) return

    const handPosition = endEffectorRef.current
    const objectPosition = objectPositionRef.current
    const touchingObject = handPosition.distanceTo(objectPosition) < 0.18

    if (taskStateRef.current === 'WAITING' && touchingObject && isPinching) {
      taskStateRef.current = 'GRABBED'
      onTaskStateChange('GRABBED')
    }

    if (taskStateRef.current === 'GRABBED') {
      scratch.current.copy(handPosition).add(new THREE.Vector3(0, -0.02, 0))
      objectPosition.lerp(scratch.current, 0.35)

      if (!isPinching) {
        const dropDistance = objectPosition.distanceTo(TARGET_CENTER)
        if (dropDistance < TARGET_RADIUS) {
          taskStateRef.current = 'SUCCESS'
          onTaskStateChange('SUCCESS')
          onSuccessDrop(dropDistance)
          objectPosition.copy(TARGET_CENTER)
        } else {
          taskStateRef.current = 'WAITING'
          onTaskStateChange('WAITING')
        }
      }
    }

    if (taskStateRef.current === 'SUCCESS') objectPosition.lerp(TARGET_CENTER, 0.25)

    object.position.copy(objectPosition)
  })

  const isSuccess = taskStateRef.current === 'SUCCESS'
  return (
    <>
      <mesh ref={objectRef} position={OBJECT_START.toArray()}>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshStandardMaterial color={isSuccess ? '#39d98a' : '#ffbe5c'} emissive={isSuccess ? '#1f7a4e' : '#5a3600'} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[TARGET_CENTER.x, -0.475, TARGET_CENTER.z]}>
        <ringGeometry args={[TARGET_RADIUS * 0.7, TARGET_RADIUS, 48]} />
        <meshStandardMaterial color={isSuccess ? '#39d98a' : '#4fd2ff'} emissive={isSuccess ? '#1f7a4e' : '#17425a'} side={THREE.DoubleSide} />
      </mesh>
    </>
  )
}

function remapToWorkspace(value: number, minInput: number, maxInput: number, minOutput: number, maxOutput: number) {
  const normalized = THREE.MathUtils.clamp((value - minInput) / (maxInput - minInput), 0, 1)
  return THREE.MathUtils.lerp(minOutput, maxOutput, normalized)
}

function mapLandmarksToRig(frame: HandsFrame | null, gestureState: GestureState): ArmRigProps {
  if (!frame || frame.landmarks.length < 13) return { baseYaw: 0, shoulderPitch: 0.2, elbowPitch: -0.15, gripOpen: 0.02 }

  const wrist = frame.landmarks[0]
  const indexTip = frame.landmarks[8]
  const middleMcp = frame.landmarks[9]
  const indexMcp = frame.landmarks[5]
  const wristXCalibrated = remapToWorkspace(wrist.x, 0.22, 0.78, -1, 1)
  const wristYCalibrated = remapToWorkspace(wrist.y, 0.2, 0.85, -1, 1)

  const baseYaw = THREE.MathUtils.clamp(gestureState.wristRotation * 0.75 + wristXCalibrated * -0.32, -0.9, 0.9)
  const shoulderPitch = THREE.MathUtils.clamp((0.55 - middleMcp.y) * 2.1 - wristYCalibrated * 0.25, -0.7, 0.9)
  const elbowPitch = THREE.MathUtils.clamp((indexMcp.y - indexTip.y) * 2.2 - 0.55, -1.1, 0.5)
  const gripOpen = THREE.MathUtils.clamp(0.07 - gestureState.gripStrength * 0.06, 0.01, 0.07)
  return { baseYaw, shoulderPitch, elbowPitch, gripOpen }
}

export function ManipulatorWorkspace({ frame, gestureState, onFinishScore }: ManipulatorWorkspaceProps) {
  const rigProps = useMemo(() => mapLandmarksToRig(frame, gestureState), [frame, gestureState])
  const [taskState, setTaskState] = useState<TrialState>('WAITING')
  const [runId, setRunId] = useState(0)
  const [resultPayload, setResultPayload] = useState<CareerTrialScore | null>(null)
  const [breakdown, setBreakdown] = useState<TrialScoreBreakdown | null>(null)
  const endEffectorRef = useRef(new THREE.Vector3())
  const trialStartRef = useRef(performance.now())
  const lastFrameRef = useRef<HandsFrame | null>(null)
  const jitterSumRef = useRef(0)
  const jitterSamplesRef = useRef(0)

  if (frame && taskState === 'GRABBED') {
    const previous = lastFrameRef.current
    if (previous && previous.landmarks.length === frame.landmarks.length && frame.landmarks.length > 0) {
      let deltaSum = 0
      for (let i = 0; i < frame.landmarks.length; i += 1) {
        const prevPoint = previous.landmarks[i]
        const currentPoint = frame.landmarks[i]
        deltaSum += Math.hypot(prevPoint.x - currentPoint.x, prevPoint.y - currentPoint.y, prevPoint.z - currentPoint.z)
      }
      jitterSumRef.current += deltaSum / frame.landmarks.length
      jitterSamplesRef.current += 1
    }
  }
  if (frame) lastFrameRef.current = frame

  const handleSuccessDrop = (dropDistance: number) => {
    const reactionTimeMs = performance.now() - trialStartRef.current
    const jitterAverage = jitterSamplesRef.current > 0 ? jitterSumRef.current / jitterSamplesRef.current : 0.01
    const scoreBreakdown = calculateTrialScores({ dropDistance, targetRadius: TARGET_RADIUS, reactionTimeMs, jitterAverage })
    const score: CareerTrialScore = {
      trialName: 'Robotics Engineer Trial',
      accuracy: scoreBreakdown.accuracy,
      stability: scoreBreakdown.stability,
      reaction: scoreBreakdown.reaction,
      suggestedDirection: 'High potential for Robotics Engineering!',
    }
    setBreakdown(scoreBreakdown)
    setResultPayload(score)
  }

  const handleReset = () => {
    setTaskState('WAITING')
    setResultPayload(null)
    setBreakdown(null)
    trialStartRef.current = performance.now()
    lastFrameRef.current = null
    jitterSumRef.current = 0
    jitterSamplesRef.current = 0
    setRunId((value) => value + 1)
  }

  return (
    <section className="ct-card">
      <header className="ct-card-head">
        <h2>Manipulator Workspace</h2>
        <p>Robotics Trial Task: grab the object and place it in the target zone.</p>
      </header>
      <p className={`ct-task-state ct-task-${taskState.toLowerCase()}`}>Task State: {taskState}{taskState === 'SUCCESS' ? ' - SUCCESS' : ''}</p>
      <div className="ct-canvas-wrap">
        <Canvas camera={{ position: [1.8, 1.2, 2.2], fov: 48 }}>
          <color attach="background" args={['#0b0e18']} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 4, 2]} intensity={1.2} />
          <gridHelper args={[6, 18, '#2d3c6a', '#19233f']} position={[0, -0.48, 0]} />
          <ArmRig {...rigProps} onEndEffectorUpdate={(position) => endEffectorRef.current.copy(position)} />
          <TrialTaskObjects
            endEffectorRef={endEffectorRef}
            isPinching={gestureState.isPinching}
            onTaskStateChange={setTaskState}
            runId={runId}
            onSuccessDrop={handleSuccessDrop}
          />
          <OrbitControls enablePan={false} minDistance={1.4} maxDistance={5} />
        </Canvas>
      </div>
      {resultPayload && breakdown ? (
        <ResultIsland
          score={resultPayload}
          breakdown={breakdown}
          onFinish={() => onFinishScore(resultPayload)}
          onReset={handleReset}
        />
      ) : null}
    </section>
  )
}
