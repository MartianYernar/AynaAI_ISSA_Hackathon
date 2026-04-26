import { Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useFBX } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { calculateTrialScores } from '../utils/scoring'
import type { CareerTrialScore, HandsFrame } from '../types'

type FirstPersonHandsWorkspaceProps = {
  frame: HandsFrame | null
  onScoreReady?: (score: CareerTrialScore) => void
}

type HandActor = {
  side: 'Left' | 'Right'
  pinchStrength: number
  isPinching: boolean
  pinchLocal: THREE.Vector3
  handCenterLocal: THREE.Vector3
  localLandmarks: THREE.Vector3[]
}

type WorldHandActor = {
  side: 'Left' | 'Right'
  isPinching: boolean
  pinchPosition: THREE.Vector3
}

const HAND_LOCAL_SCALE = new THREE.Vector3(0.56, 0.44, 0.34)
const HAND_LOCAL_OFFSET = new THREE.Vector3(0, -0.18, -0.38)
const TARGET_CENTER: [number, number, number] = [0.72, 0.14, -0.72]
const TARGET_RADIUS = 0.2
const EYE_HEIGHT = 0.72

function clamp01(value: number) {
  return THREE.MathUtils.clamp(value, 0, 1)
}

function remap(value: number, minIn: number, maxIn: number, minOut: number, maxOut: number) {
  const normalized = clamp01((value - minIn) / (maxIn - minIn))
  return THREE.MathUtils.lerp(minOut, maxOut, normalized)
}

function mapHandPointToWorld(point: { x: number; y: number; z: number }) {
  const xNorm = (0.5 - point.x) * 2
  const yNorm = (0.5 - point.y) * 2
  const zNorm = THREE.MathUtils.clamp(point.z, -0.3, 0.3)
  return new THREE.Vector3(
    xNorm * HAND_LOCAL_SCALE.x + HAND_LOCAL_OFFSET.x,
    yNorm * HAND_LOCAL_SCALE.y + HAND_LOCAL_OFFSET.y,
    zNorm * HAND_LOCAL_SCALE.z + HAND_LOCAL_OFFSET.z,
  )
}

function computeHandActors(frame: HandsFrame | null) {
  if (!frame || frame.hands.length === 0) return [] as HandActor[]
  return frame.hands.map((hand) => {
    const thumbTip = hand.landmarks[4]
    const indexTip = hand.landmarks[8]
    const middleMcp = hand.landmarks[9]
    const wrist = hand.landmarks[0]
    const pinchDistance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y)
    const palmHeight = Math.max(0.04, Math.abs(wrist.y - middleMcp.y))
    const pinchStrength = clamp01(remap(pinchDistance, 0.02, palmHeight * 1.1, 1, 0))
    const isPinching = pinchStrength > 0.58
    const side: HandActor['side'] = hand.handedness === 'Left' ? 'Left' : 'Right'
    const localLandmarks = hand.landmarks.map((landmark) => mapHandPointToWorld(landmark))
    const handCenterLocal = new THREE.Vector3()
      .add(localLandmarks[0])
      .add(localLandmarks[5])
      .add(localLandmarks[9])
      .add(localLandmarks[13])
      .add(localLandmarks[17])
      .multiplyScalar(0.2)
    const pinchMidpoint = {
      x: (thumbTip.x + indexTip.x) * 0.5,
      y: (thumbTip.y + indexTip.y) * 0.5,
      z: (thumbTip.z + indexTip.z) * 0.5,
    }
    return {
      side,
      pinchStrength,
      isPinching,
      pinchLocal: mapHandPointToWorld(pinchMidpoint),
      handCenterLocal,
      localLandmarks,
    }
  })
}

function HandModel({ actor, isGrabbed }: { actor: HandActor; isGrabbed: boolean }) {
  const lm = actor.localLandmarks
  if (lm.length < 21) return null

  const wrist = lm[0]
  const indexMcp = lm[5]
  const middleMcp = lm[9]
  const ringMcp = lm[13]
  const pinkyMcp = lm[17]

  const palmCenter = useMemo(() => {
    const center = new THREE.Vector3()
    center.add(wrist).add(indexMcp).add(middleMcp).add(ringMcp).add(pinkyMcp).multiplyScalar(0.2)
    return center
  }, [indexMcp, middleMcp, pinkyMcp, ringMcp, wrist])

  const palmRight = useMemo(
    () => new THREE.Vector3().subVectors(indexMcp, pinkyMcp).normalize(),
    [indexMcp, pinkyMcp],
  )
  const palmUp = useMemo(
    () => new THREE.Vector3().subVectors(middleMcp, wrist).normalize(),
    [middleMcp, wrist],
  )
  const palmForward = useMemo(
    () => new THREE.Vector3().crossVectors(palmRight, palmUp).normalize(),
    [palmRight, palmUp],
  )
  const palmQuaternion = useMemo(() => {
    const matrix = new THREE.Matrix4().makeBasis(palmRight, palmUp, palmForward)
    return new THREE.Quaternion().setFromRotationMatrix(matrix)
  }, [palmForward, palmRight, palmUp])

  const toneColor = isGrabbed ? '#fff3cf' : actor.isPinching ? '#f7fffa' : '#f7f9fd'
  const emissiveColor = isGrabbed ? '#3f2b00' : actor.isPinching ? '#123a2a' : '#122038'
  const fingerChains = [[1, 2, 4], [5, 6, 8], [9, 10, 12], [13, 14, 16], [17, 18, 20]]

  return (
    <group renderOrder={10}>
      <mesh position={palmCenter} quaternion={palmQuaternion} castShadow>
        <sphereGeometry args={[0.052, 12, 12]} />
        <meshStandardMaterial
          color={toneColor}
          emissive={emissiveColor}
          emissiveIntensity={0.08}
          roughness={0.78}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <mesh
        position={new THREE.Vector3().copy(wrist).add(palmUp.clone().multiplyScalar(-0.05))}
        quaternion={palmQuaternion}
        castShadow
      >
        <cylinderGeometry args={[0.034, 0.04, 0.065, 10]} />
        <meshStandardMaterial
          color={toneColor}
          emissive={emissiveColor}
          emissiveIntensity={0.05}
          roughness={0.8}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {fingerChains.map((chain, chainIndex) => {
        const baseRadius = chainIndex === 0 ? 0.015 : 0.013
        return (
          <group key={`glove-finger-${actor.side}-${chainIndex}`}>
            {chain.slice(0, -1).map((jointIndex, segmentIndex) => {
              const start = lm[jointIndex]
              const end = lm[chain[segmentIndex + 1]]
              const direction = new THREE.Vector3().subVectors(end, start)
              const length = Math.max(0.008, direction.length())
              const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
              const quaternion = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                direction.clone().normalize(),
              )
              const radius = baseRadius * (1 - segmentIndex * 0.16)
              return (
                <group key={`glove-seg-${actor.side}-${chainIndex}-${segmentIndex}`}>
                  <mesh position={midpoint} quaternion={quaternion} castShadow>
                    <cylinderGeometry args={[radius, radius * 1.04, length, 8]} />
                    <meshStandardMaterial
                      color={toneColor}
                      emissive={emissiveColor}
                      emissiveIntensity={0.05}
                      roughness={0.82}
                      depthTest={false}
                      depthWrite={false}
                    />
                  </mesh>
                  <mesh position={end} castShadow>
                    <sphereGeometry args={[radius * 0.95, 8, 8]} />
                    <meshStandardMaterial
                      color={toneColor}
                      emissive={emissiveColor}
                      emissiveIntensity={0.05}
                      roughness={0.82}
                      depthTest={false}
                      depthWrite={false}
                    />
                  </mesh>
                </group>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

function CameraHandsRig({
  actors,
  grabbedHands,
  showCalibrationMarkers,
}: {
  actors: HandActor[]
  grabbedHands: Set<'Left' | 'Right'>
  showCalibrationMarkers?: boolean
}) {
  const { camera } = useThree()
  const rigRef = useRef<THREE.Group | null>(null)

  const leftActor = actors.find((actor) => actor.side === 'Left')
  const rightActor = actors.find((actor) => actor.side === 'Right')
  useFrame(() => {
    if (!rigRef.current) return
    rigRef.current.position.copy(camera.position)
    rigRef.current.quaternion.copy(camera.quaternion)
  })

  return (
    <group ref={rigRef}>
      {leftActor ? <HandModel actor={leftActor} isGrabbed={grabbedHands.has('Left')} /> : null}
      {rightActor ? <HandModel actor={rightActor} isGrabbed={grabbedHands.has('Right')} /> : null}
      {showCalibrationMarkers && leftActor ? (
        <mesh position={leftActor.handCenterLocal}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color="#ffe26e" emissive="#7a5f1d" depthTest={false} depthWrite={false} />
        </mesh>
      ) : null}
      {showCalibrationMarkers && rightActor ? (
        <mesh position={rightActor.handCenterLocal}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshStandardMaterial color="#ffe26e" emissive="#7a5f1d" depthTest={false} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  )
}

function SpoonMesh({ heldBy }: { heldBy: 'Left' | 'Right' | null }) {
  const spoon = useFBX('/models/spoon.fbx')
  const spoonClone = useMemo(() => {
    const clone = spoon.clone(true)
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true
        node.receiveShadow = true
        node.material = new THREE.MeshStandardMaterial({
          color: '#9da4ad',
          metalness: 0.78,
          roughness: 0.28,
        })
      }
    })
    return clone
  }, [spoon])
  return (
    <group position={[-0.02, 0.01, 0]} rotation={[Math.PI * 0.5, Math.PI * 0.5, 0]} scale={0.00042}>
      <primitive object={spoonClone} />
      {heldBy ? null : (
        <mesh position={[0.06, 0, 0]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#b9c6d8" metalness={0.4} roughness={0.4} />
        </mesh>
      )}
    </group>
  )
}

function GrabbableCube({
  id,
  position,
  worldActorsRef,
  color,
  kind,
  onGrabChanged,
  onRelease,
}: {
  id: string
  position: [number, number, number]
  worldActorsRef: MutableRefObject<WorldHandActor[]>
  color: string
  kind: 'knife' | 'spoon' | 'tomato' | 'onion' | 'cucumber' | 'carrot' | 'lemon' | 'pepper' | 'plate'
  onGrabChanged: (id: string, side: 'Left' | 'Right' | null) => void
  onRelease: (dropDistance: number) => void
}) {
  const { camera } = useThree()
  const bodyRef = useRef<RapierRigidBody | null>(null)
  const [heldBy, setHeldBy] = useState<'Left' | 'Right' | null>(null)
  const target = useMemo(() => new THREE.Vector3(TARGET_CENTER[0], TARGET_CENTER[1], TARGET_CENTER[2]), [])
  const rotationOffset = useMemo(
    () =>
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          kind === 'spoon' ? Math.PI * 0.5 : Math.PI * 0.2,
          kind === 'spoon' ? Math.PI * 0.35 : 0,
          kind === 'knife' ? Math.PI * 0.1 : kind === 'plate' ? Math.PI * 0.5 : 0,
        ),
      ),
    [kind],
  )
  const kinematicQuat = useRef(new THREE.Quaternion())
  useFrame(() => {
    const body = bodyRef.current
    if (!body) return
    const bodyPos = body.translation()
    const actors = worldActorsRef.current
    const activeHolder = actors.find((actor) => actor.side === heldBy)
    if (activeHolder && activeHolder.isPinching) {
      body.setBodyType(2, true)
      body.setNextKinematicTranslation(activeHolder.pinchPosition)
      kinematicQuat.current.copy(camera.quaternion).multiply(rotationOffset)
      body.setNextKinematicRotation(kinematicQuat.current)
      return
    }
    if (heldBy && (!activeHolder || !activeHolder.isPinching)) {
      onRelease(new THREE.Vector3(bodyPos.x, bodyPos.y, bodyPos.z).distanceTo(target))
      body.setBodyType(0, true)
      setHeldBy(null)
    }
    if (!heldBy) {
      const candidate = actors.find((actor) => {
        if (!actor.isPinching) return false
        const distance = Math.hypot(actor.pinchPosition.x - bodyPos.x, actor.pinchPosition.y - bodyPos.y, actor.pinchPosition.z - bodyPos.z)
        return distance < 0.4
      })
      if (candidate) {
        setHeldBy(candidate.side)
        body.setBodyType(2, true)
      }
    }
  })
  useEffect(() => {
    onGrabChanged(id, heldBy)
  }, [heldBy, id, onGrabChanged])
  return (
    <RigidBody ref={bodyRef} colliders="cuboid" restitution={0.2} friction={1} position={position}>
      {kind === 'knife' ? (
        <group>
          <mesh castShadow position={[0, 0.01, 0]}>
            <boxGeometry args={[0.09, 0.018, 0.018]} />
            <meshStandardMaterial
              color={heldBy ? '#ffd86f' : '#2a2b2f'}
              emissive={heldBy ? '#6b4c0f' : '#111113'}
            />
          </mesh>
          <mesh castShadow position={[0.07, 0.015, 0]}>
            <boxGeometry args={[0.14, 0.01, 0.012]} />
            <meshStandardMaterial
              color={heldBy ? '#ffe29f' : color}
              emissive={heldBy ? '#6b4c0f' : '#1f2632'}
              metalness={0.65}
              roughness={0.28}
            />
          </mesh>
        </group>
      ) : kind === 'spoon' ? (
        <group>
          <SpoonMesh heldBy={heldBy} />
        </group>
      ) : kind === 'plate' ? (
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.028, 32]} />
          <meshStandardMaterial
            color={heldBy ? '#ffd86f' : '#4b87dc'}
            emissive={heldBy ? '#6b4c0f' : '#163f7a'}
            roughness={0.35}
            metalness={0.1}
          />
        </mesh>
      ) : kind === 'carrot' ? (
        <mesh castShadow>
          <cylinderGeometry args={[0.018, 0.008, 0.12, 12]} />
          <meshStandardMaterial color={heldBy ? '#ffd86f' : '#d98b3b'} roughness={0.45} />
        </mesh>
      ) : kind === 'cucumber' ? (
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.13, 12]} />
          <meshStandardMaterial color={heldBy ? '#ffd86f' : '#4ea564'} roughness={0.5} />
        </mesh>
      ) : (
        <mesh castShadow>
          <sphereGeometry args={[kind === 'pepper' ? 0.028 : 0.03, 12, 12]} />
          <meshStandardMaterial
            color={
              heldBy
                ? '#ffd86f'
                : kind === 'tomato'
                  ? '#d74c45'
                  : kind === 'onion'
                    ? '#d8c69f'
                    : kind === 'lemon'
                      ? '#e0cd55'
                      : '#cc5548'
            }
            roughness={0.5}
          />
        </mesh>
      )}
    </RigidBody>
  )
}

function Scene({
  actors,
  showCalibrationMarkers,
  onTrialStats,
}: {
  actors: HandActor[]
  showCalibrationMarkers?: boolean
  onTrialStats: (stats: { attempts: number; successes: number; bestDropDistance: number; jitter: number }) => void
}) {
  const { camera } = useThree()
  const [grabState, setGrabState] = useState<Record<string, 'Left' | 'Right' | null>>({
    knife: null,
    spoon: null,
    plate: null,
    tomato: null,
    onion: null,
    cucumber: null,
    carrot: null,
    lemon: null,
    pepper: null,
  })
  const [attempts, setAttempts] = useState(0)
  const [successes, setSuccesses] = useState(0)
  const [bestDropDistance, setBestDropDistance] = useState(TARGET_RADIUS)
  const pinchJitterRef = useRef(0.01)
  const pinchSamplesRef = useRef(0)
  const previousPinchRef = useRef<Record<'Left' | 'Right', THREE.Vector3 | null>>({
    Left: null,
    Right: null,
  })
  const worldActorsRef = useRef<WorldHandActor[]>([])
  useFrame(() => {
    worldActorsRef.current = actors.map((actor) => {
      const worldPinch = actor.pinchLocal.clone()
      camera.localToWorld(worldPinch)
      return {
        side: actor.side,
        isPinching: actor.isPinching,
        pinchPosition: worldPinch,
      }
    })

    worldActorsRef.current.forEach((actor) => {
      if (!actor.isPinching) {
        previousPinchRef.current[actor.side] = null
        return
      }
      const previous = previousPinchRef.current[actor.side]
      if (previous) {
        pinchJitterRef.current += previous.distanceTo(actor.pinchPosition)
        pinchSamplesRef.current += 1
      }
      previousPinchRef.current[actor.side] = actor.pinchPosition.clone()
    })
  })
  useEffect(() => {
    const avgJitter = pinchSamplesRef.current > 0 ? pinchJitterRef.current / pinchSamplesRef.current : 0.01
    onTrialStats({ attempts, successes, bestDropDistance, jitter: avgJitter })
  }, [attempts, bestDropDistance, onTrialStats, successes])
  const grabbedHands = useMemo(() => {
    const set = new Set<'Left' | 'Right'>()
    Object.values(grabState).forEach((side) => {
      if (side) set.add(side)
    })
    return set
  }, [grabState])
  return (
    <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60} interpolate={false} updateLoop="independent">
      <ambientLight intensity={0.58} />
      <directionalLight position={[2, 4, 1]} intensity={1.0} castShadow />
      <hemisphereLight intensity={0.38} color="#f4f7fb" groundColor="#4b4e54" />

      <RigidBody type="fixed" colliders="cuboid" position={[0, 1.5, -2.05]}>
        <mesh receiveShadow>
          <boxGeometry args={[8, 3.2, 0.12]} />
          <meshStandardMaterial color="#d8e0ea" />
        </mesh>
      </RigidBody>
      <mesh position={[-3.05, 1.56, -1.98]} castShadow>
        <boxGeometry args={[0.95, 1.2, 0.1]} />
        <meshStandardMaterial color="#6b4a33" />
      </mesh>
      <mesh position={[-3.05, 1.56, -1.93]}>
        <boxGeometry args={[0.78, 1.02, 0.02]} />
        <meshStandardMaterial color="#f8f3e5" />
      </mesh>

      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.08, -0.52]}>
        <mesh receiveShadow>
          <boxGeometry args={[4.8, 0.16, 3.4]} />
          <meshStandardMaterial color="#e3e6ec" roughness={0.85} metalness={0.06} />
        </mesh>
      </RigidBody>
      {[-2.15, -1.15, -0.15, 0.85, 1.85].map((x) => (
        <mesh key={`tile-x-${x}`} position={[x, 0.002, -0.52]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.03, 3.4]} />
          <meshStandardMaterial color="#cfd3db" />
        </mesh>
      ))}
      {[-2.05, -1.35, -0.65, 0.05, 0.75].map((z) => (
        <mesh key={`tile-z-${z}`} position={[0, 0.002, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.8, 0.03]} />
          <meshStandardMaterial color="#cfd3db" />
        </mesh>
      ))}

      <RigidBody type="fixed" colliders="cuboid" position={[0.15, -0.32, -0.8]}>
        <mesh receiveShadow>
          <boxGeometry args={[5.8, 0.56, 2.1]} />
          <meshStandardMaterial color="#836149" roughness={0.58} />
        </mesh>
      </RigidBody>
      {[-2.3, -1.2, -0.1, 1, 2.1].map((x) => (
        <mesh key={`lower-door-${x}`} position={[x, -0.3, 0.0]} castShadow>
          <boxGeometry args={[0.95, 0.42, 0.03]} />
          <meshStandardMaterial color="#8f6a4e" roughness={0.55} />
        </mesh>
      ))}

      <RigidBody type="fixed" colliders="cuboid" position={[0.15, 0.02, -0.8]}>
        <mesh receiveShadow>
          <boxGeometry args={[5.8, 0.08, 2.1]} />
          <meshStandardMaterial color="#eceef2" roughness={0.78} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid" position={[-1.72, 0.2, -0.65]}>
        <mesh castShadow>
          <boxGeometry args={[0.95, 0.22, 0.62]} />
          <meshStandardMaterial color="#2a303a" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[-2.12, 0.32, -0.64]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.28, 12]} />
          <meshStandardMaterial color="#aeb5bf" metalness={0.7} roughness={0.35} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid" position={[1.6, 0.2, -0.63]}>
        <mesh castShadow>
          <boxGeometry args={[1.0, 0.25, 0.7]} />
          <meshStandardMaterial color="#cfc6b9" />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[1.6, 0.29, -0.63]}>
        <mesh castShadow>
          <boxGeometry args={[0.82, 0.05, 0.55]} />
          <meshStandardMaterial color="#3b4048" />
        </mesh>
      </RigidBody>
      <mesh position={[1.45, 0.3, -0.64]} castShadow>
        <torusGeometry args={[0.11, 0.02, 12, 24]} />
        <meshStandardMaterial color="#8e96a1" />
      </mesh>
      <mesh position={[1.78, 0.33, -0.67]} castShadow>
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshStandardMaterial color="#b98a2f" />
      </mesh>

      <mesh position={[-1.05, 1.08, -1.95]} castShadow>
        <boxGeometry args={[1.85, 0.08, 0.26]} />
        <meshStandardMaterial color="#7d3e24" />
      </mesh>
      {[-1.65, -1.15, -0.65].map((x, index) => (
        <group key={`pan-${x}`}>
          <mesh position={[x, 0.84, -1.95]} castShadow>
            <cylinderGeometry args={[0.01, 0.01, 0.42, 8]} />
            <meshStandardMaterial color="#777f8f" />
          </mesh>
          <mesh position={[x, 0.66, -1.95]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.17 - index * 0.03, 0.02, 12, 24]} />
            <meshStandardMaterial color={index === 1 ? '#8b8f97' : '#232933'} />
          </mesh>
        </group>
      ))}

      <mesh position={[0.95, 1.3, -1.95]} castShadow>
        <boxGeometry args={[1.2, 0.8, 0.34]} />
        <meshStandardMaterial color="#8b664a" />
      </mesh>
      <mesh position={[0.55, 0.95, -1.95]} castShadow>
        <boxGeometry args={[2.1, 0.05, 0.22]} />
        <meshStandardMaterial color="#8b664a" />
      </mesh>
      {[-0.15, 0.1, 0.35, 0.6, 0.85].map((x, idx) => (
        <mesh key={`cup-${x}`} position={[x, 0.97, -1.88]} castShadow>
          <cylinderGeometry args={[0.05, 0.055, 0.12, 10]} />
          <meshStandardMaterial
            color={['#d2cf6a', '#6ca0e4', '#5dbf78', '#cf4e42', '#8e6fca'][idx]}
            roughness={0.35}
          />
        </mesh>
      ))}
      <mesh position={[1.95, 1.02, -1.92]} castShadow>
        <boxGeometry args={[1.0, 0.04, 0.22]} />
        <meshStandardMaterial color="#7d3f25" />
      </mesh>
      {[1.65, 1.85, 2.05, 2.25].map((x, i) => (
        <mesh key={`glass-${x}`} position={[x, 0.96, -1.88]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.16, 10]} />
          <meshStandardMaterial color={['#db5962', '#7db060', '#678fd1', '#9d70cd'][i]} roughness={0.25} />
        </mesh>
      ))}

      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.85, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[8, 1, 8]} />
          <meshStandardMaterial color="#d8d2c6" />
        </mesh>
      </RigidBody>

      <mesh position={TARGET_CENTER} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[TARGET_RADIUS * 0.65, TARGET_RADIUS, 36]} />
        <meshStandardMaterial color="#58dca1" emissive="#1f6d51" />
      </mesh>

      <RigidBody type="fixed" colliders="cuboid" position={[-0.58, 0.11, -0.8]}>
        <mesh castShadow>
          <boxGeometry args={[0.65, 0.02, 0.32]} />
          <meshStandardMaterial color="#b8895d" roughness={0.68} />
        </mesh>
      </RigidBody>
      <GrabbableCube
        id="tomato"
        position={[-0.78, 0.14, -0.83]}
        worldActorsRef={worldActorsRef}
        color="#d74c45"
        kind="tomato"
        onGrabChanged={(id, side) => setGrabState((prev) => (prev[id] === side ? prev : { ...prev, [id]: side }))}
        onRelease={() => {}}
      />
      <GrabbableCube
        id="onion"
        position={[-0.68, 0.14, -0.72]}
        worldActorsRef={worldActorsRef}
        color="#d8c69f"
        kind="onion"
        onGrabChanged={(id, side) => setGrabState((prev) => (prev[id] === side ? prev : { ...prev, [id]: side }))}
        onRelease={() => {}}
      />
      <GrabbableCube
        id="cucumber"
        position={[-0.58, 0.14, -0.88]}
        worldActorsRef={worldActorsRef}
        color="#4ea564"
        kind="cucumber"
        onGrabChanged={(id, side) => setGrabState((prev) => (prev[id] === side ? prev : { ...prev, [id]: side }))}
        onRelease={() => {}}
      />
      <GrabbableCube
        id="carrot"
        position={[-0.46, 0.14, -0.75]}
        worldActorsRef={worldActorsRef}
        color="#d98b3b"
        kind="carrot"
        onGrabChanged={(id, side) => setGrabState((prev) => (prev[id] === side ? prev : { ...prev, [id]: side }))}
        onRelease={() => {}}
      />
      <GrabbableCube
        id="lemon"
        position={[-0.39, 0.14, -0.85]}
        worldActorsRef={worldActorsRef}
        color="#e0cd55"
        kind="lemon"
        onGrabChanged={(id, side) => setGrabState((prev) => (prev[id] === side ? prev : { ...prev, [id]: side }))}
        onRelease={() => {}}
      />
      <GrabbableCube
        id="pepper"
        position={[-0.52, 0.14, -0.67]}
        worldActorsRef={worldActorsRef}
        color="#cc5548"
        kind="pepper"
        onGrabChanged={(id, side) => setGrabState((prev) => (prev[id] === side ? prev : { ...prev, [id]: side }))}
        onRelease={() => {}}
      />

      <GrabbableCube
        id="knife"
        position={[0.15, 0.14, -0.74]}
        worldActorsRef={worldActorsRef}
        color="#aab7cc"
        kind="knife"
        onGrabChanged={(id, side) => setGrabState((prev) => (prev[id] === side ? prev : { ...prev, [id]: side }))}
        onRelease={(dropDistance) => {
          setAttempts((value) => value + 1)
          setBestDropDistance((prev) => Math.min(prev, dropDistance))
          if (dropDistance <= TARGET_RADIUS) setSuccesses((value) => value + 1)
        }}
      />
      <GrabbableCube
        id="spoon"
        position={[-0.06, 0.14, -0.74]}
        worldActorsRef={worldActorsRef}
        color="#b9c6d8"
        kind="spoon"
        onGrabChanged={(id, side) => setGrabState((prev) => (prev[id] === side ? prev : { ...prev, [id]: side }))}
        onRelease={(dropDistance) => {
          setAttempts((value) => value + 1)
          setBestDropDistance((prev) => Math.min(prev, dropDistance))
          if (dropDistance <= TARGET_RADIUS) setSuccesses((value) => value + 1)
        }}
      />
      <GrabbableCube
        id="plate"
        position={[0.92, 0.14, -0.74]}
        worldActorsRef={worldActorsRef}
        color="#4b87dc"
        kind="plate"
        onGrabChanged={(id, side) => setGrabState((prev) => (prev[id] === side ? prev : { ...prev, [id]: side }))}
        onRelease={() => {}}
      />
      <CameraHandsRig
        actors={actors}
        grabbedHands={grabbedHands}
        showCalibrationMarkers={showCalibrationMarkers}
      />
    </Physics>
  )
}

function FirstPersonController() {
  const { camera, gl } = useThree()
  const keysRef = useRef({
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
  })
  const yawRef = useRef(0)
  const pitchRef = useRef(-0.08)

  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, 0.1)
    camera.rotation.order = 'YXZ'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code in keysRef.current) {
        keysRef.current[event.code as keyof typeof keysRef.current] = true
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code in keysRef.current) {
        keysRef.current[event.code as keyof typeof keysRef.current] = false
      }
    }
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return
      yawRef.current -= event.movementX * 0.0022
      pitchRef.current -= event.movementY * 0.0018
      pitchRef.current = THREE.MathUtils.clamp(pitchRef.current, -1.08, 1.08)
    }
    const onClick = () => {
      if (document.pointerLockElement !== gl.domElement) {
        gl.domElement.requestPointerLock()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)
    gl.domElement.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousemove', onMouseMove)
      gl.domElement.removeEventListener('click', onClick)
    }
  }, [camera, gl.domElement])

  useFrame((_, delta) => {
    camera.rotation.y = yawRef.current
    camera.rotation.x = pitchRef.current
    const speed = 1.8
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    if (forward.lengthSq() < 1e-6) return
    forward.normalize()
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
    const velocity = new THREE.Vector3()
    if (keysRef.current.KeyW) velocity.add(forward)
    if (keysRef.current.KeyS) velocity.sub(forward)
    if (keysRef.current.KeyD) velocity.add(right)
    if (keysRef.current.KeyA) velocity.sub(right)
    if (velocity.lengthSq() > 0) {
      velocity.normalize().multiplyScalar(speed * delta)
      camera.position.add(velocity)
      camera.position.y = EYE_HEIGHT
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -1.55, 1.55)
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -1.2, 0.9)
    }
  })
  return null
}

export function FirstPersonHandsWorkspace({ frame, onScoreReady }: FirstPersonHandsWorkspaceProps) {
  const actors = useMemo(() => computeHandActors(frame), [frame])
  const [showCalibrationMarkers, setShowCalibrationMarkers] = useState(true)
  const startRef = useRef(performance.now())
  const [trialStats, setTrialStats] = useState({ attempts: 0, successes: 0, bestDropDistance: TARGET_RADIUS, jitter: 0.01 })
  const [latestScore, setLatestScore] = useState<CareerTrialScore | null>(null)

  useEffect(() => {
    if (!trialStats.successes) return
    const breakdown = calculateTrialScores({
      dropDistance: trialStats.bestDropDistance,
      targetRadius: TARGET_RADIUS,
      reactionTimeMs: performance.now() - startRef.current,
      jitterAverage: trialStats.jitter,
    })
    const score: CareerTrialScore = {
      trialName: 'Ayna AI Career Trial - Kitchen Simulation',
      accuracy: breakdown.accuracy,
      stability: breakdown.stability,
      reaction: breakdown.reaction,
      suggestedDirection:
        breakdown.overall >= 80
          ? 'Strong fit: Robotics / Computer Vision'
          : 'Developing fit: Continue lab-interaction practice',
    }
    setLatestScore(score)
    onScoreReady?.(score)
  }, [onScoreReady, trialStats])

  return (
    <section className="ct-fp-shell">
      <Canvas shadows camera={{ position: [0, 0.72, 0.1], fov: 82 }}>
        <color attach="background" args={['#cfd7e2']} />
        <fog attach="fog" args={['#d7dfeb', 5, 11]} />
        <FirstPersonController />
        <Scene actors={actors} showCalibrationMarkers={showCalibrationMarkers} onTrialStats={setTrialStats} />
      </Canvas>
      <div className="ct-fp-overlay">
        <strong>Ayna Kitchen Simulation</strong>
        <span>Hands tracked: {actors.length}</span>
        <span>{actors.some((actor) => actor.isPinching) ? 'Pinch grab active' : 'Open hand mode'}</span>
        <span>Move: WASD | Look: click + mouse</span>
        <span>Placements: {trialStats.successes}/{Math.max(trialStats.attempts, 1)}</span>
        <span>Best drop distance: {trialStats.bestDropDistance.toFixed(3)}m</span>
        <span>
          Hand local scale: {HAND_LOCAL_SCALE.x.toFixed(2)}, {HAND_LOCAL_SCALE.y.toFixed(2)},{' '}
          {HAND_LOCAL_SCALE.z.toFixed(2)}
        </span>
        <span>
          Hand local offset: {HAND_LOCAL_OFFSET.x.toFixed(2)}, {HAND_LOCAL_OFFSET.y.toFixed(2)},{' '}
          {HAND_LOCAL_OFFSET.z.toFixed(2)}
        </span>
        <button className="ct-button ct-button-secondary" type="button" onClick={() => setShowCalibrationMarkers((value) => !value)}>
          {showCalibrationMarkers ? 'Hide' : 'Show'} Hand Center Marker
        </button>
        {latestScore ? <span>Score A/S/R: {latestScore.accuracy}/{latestScore.stability}/{latestScore.reaction}</span> : null}
      </div>
    </section>
  )
}

