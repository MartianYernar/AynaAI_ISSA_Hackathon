import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useGLTF, PerspectiveCamera as DreiPerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion } from "framer-motion";
import {
  Box3,
  Euler,
  MathUtils,
  Vector3,
  PerspectiveCamera as ThreePerspectiveCamera,
  type Bone,
  type Group,
  type Mesh,
  type Object3D,
} from "three";

const LYRA_MODEL_URL = "/characters3d/lyra-landing/lyra.glb";
const HERO_CAMERA_POSITION: [number, number, number] = [0, 1.25, 4.5];
const HERO_LOOK_AT: [number, number, number] = [0, 1.15, 0];
const HERO_MODEL_POSITION: [number, number, number] = [0, 0.96, 0];
const HERO_MODEL_ROTATION: [number, number, number] = [Math.PI / 2, 0, 0];
const HERO_MODEL_SCALE = 1.7;
const HERO_CAMERA_ZOOM_IN = 4.05;
const HERO_ARMATURE_TRANSFORM = {
  position: [0.03, 0.15, 1.03] as [number, number, number],
  rotation: [-1.58, -0.32, -0.02] as [number, number, number],
  scale: 0.01,
};

type BoneCandidates = {
  chest: Bone | null;
  eyes: Bone[];
  head: Bone | null;
  neck: Bone | null;
};

type MorphTarget = {
  index: number;
  mesh: Mesh;
  name: string;
  type: "blink" | "smile" | "eye";
};

interface HeroLyra3DProps {
  isExiting: boolean;
  parallax: {
    x: number;
    y: number;
  };
  reduceMotion: boolean;
}

class ModelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[HeroLyra3D] Failed to load Lyra GLB.", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="hero-lyra-3d-fallback" role="alert">
          Lyra 3D model missing
        </div>
      );
    }

    return this.props.children;
  }
}

function findBone(root: Object3D, names: string[]): Bone | null {
  let matchedBone: Bone | null = null;
  const normalizedNames = names.map((name) => name.toLowerCase());

  root.traverse((object) => {
    if (matchedBone || object.type !== "Bone") {
      return;
    }

    if (normalizedNames.includes(object.name.toLowerCase())) {
      matchedBone = object as Bone;
    }
  });

  return matchedBone;
}

function matchesAnyPattern(name: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(name));
}

function findBoneCandidates(root: Object3D): BoneCandidates {
  const bones: Bone[] = [];

  root.traverse((object) => {
    if (object.type === "Bone") {
      bones.push(object as Bone);
    }
  });

  const findFirst = (patterns: RegExp[]) =>
    bones.find((bone) => matchesAnyPattern(bone.name, patterns)) ?? null;

  return {
    chest: findFirst([
      /^spine$/i,
      /chest/i,
      /upper.?chest/i,
      /mixamorigspine2/i,
      /mixamorigspine/i,
      /^spine0?2$/i,
      /^spine0?1$/i,
    ]),
    eyes: bones.filter((bone) =>
      matchesAnyPattern(bone.name, [
        /eye/i,
        /left.?eye/i,
        /right.?eye/i,
        /eye_l/i,
        /eye_r/i,
      ]),
    ),
    head:
      findBone(root, ["Head", "head", "mixamorigHead", "Neck_Head"]) ??
      findFirst([/^head$/i, /mixamorighead/i, /neck_head/i]),
    neck:
      findBone(root, ["Neck", "neck", "mixamorigNeck"]) ??
      findFirst([/^neck$/i, /mixamorigneck/i]),
  };
}

function collectSceneChildNames(root: Object3D) {
  return root.children.map((child) => child.name || child.type || "(unnamed child)");
}

function collectBones(root: Object3D) {
  const bones: string[] = [];

  root.traverse((object) => {
    if (object.type === "Bone") {
      bones.push(object.name || "(unnamed bone)");
    }
  });

  return bones;
}

function collectMorphTargets(root: Object3D): MorphTarget[] {
  const targets: MorphTarget[] = [];

  root.traverse((object) => {
    const mesh = object as Mesh;
    const dictionary = mesh.morphTargetDictionary;

    if (!dictionary || !mesh.morphTargetInfluences) {
      return;
    }

    Object.entries(dictionary).forEach(([name, index]) => {
      const lowerName = name.toLowerCase();
      const type = lowerName.includes("blink")
        ? "blink"
        : lowerName.includes("smile")
          ? "smile"
          : lowerName.includes("eye")
            ? "eye"
            : null;

      if (type) {
        targets.push({ index, mesh, name, type });
      }
    });
  });

  return targets;
}

function logModelDiagnostics(
  scene: Group,
  animations: Array<{ name: string }> | undefined,
  candidates: BoneCandidates,
  morphTargets: MorphTarget[],
) {
  if (!import.meta.env.DEV) {
    return;
  }

  const box = new Box3().setFromObject(scene);
  const size = new Vector3();
  box.getSize(size);

  console.info("[HeroLyra3D] Scene child names:", collectSceneChildNames(scene));
  console.info("[HeroLyra3D] Bones:", collectBones(scene));
  console.info("[HeroLyra3D] Candidate bones:", {
    chest: candidates.chest?.name ?? null,
    eyes: candidates.eyes.map((bone) => bone.name),
    head: candidates.head?.name ?? null,
    neck: candidates.neck?.name ?? null,
  });
  console.info(
    "[HeroLyra3D] Morph target names:",
    morphTargets.map((target) => target.name),
  );
  console.info(
    "[HeroLyra3D] Animation clip names:",
    animations?.map((clip) => clip.name || "(unnamed clip)") ?? [],
  );
  console.info("[HeroLyra3D] Bounding box size:", {
    x: Number(size.x.toFixed(3)),
    y: Number(size.y.toFixed(3)),
    z: Number(size.z.toFixed(3)),
  });
  console.info("[HeroLyra3D] Composition:", {
    HERO_CAMERA_POSITION,
    HERO_LOOK_AT,
    HERO_MODEL_POSITION,
    HERO_MODEL_ROTATION,
    HERO_MODEL_SCALE,
    HERO_CAMERA_ZOOM_IN,
    HERO_ARMATURE_TRANSFORM,
  });
}

function CameraRig({
  isHovered,
  reduceMotion,
  cameraRef,
}: {
  isHovered: boolean;
  reduceMotion: boolean;
  cameraRef: RefObject<ThreePerspectiveCamera | null>;
}) {
  useFrame((_, delta) => {
    const camera = cameraRef.current;

    if (!camera) {
      return;
    }

    const targetZ = isHovered ? HERO_CAMERA_ZOOM_IN : HERO_CAMERA_POSITION[2];
    camera.position.x = reduceMotion
      ? HERO_CAMERA_POSITION[0]
      : MathUtils.damp(camera.position.x, HERO_CAMERA_POSITION[0], 4.2, delta);
    camera.position.y = reduceMotion
      ? HERO_CAMERA_POSITION[1]
      : MathUtils.damp(camera.position.y, HERO_CAMERA_POSITION[1], 4.2, delta);
    camera.position.z = reduceMotion
      ? targetZ
      : MathUtils.damp(camera.position.z, targetZ, 3.6, delta);
    camera.lookAt(...HERO_LOOK_AT);
    camera.updateProjectionMatrix();
  });

  return null;
}

function LyraRiggedModel({
  isHovered,
  parallax,
  reduceMotion,
}: {
  isHovered: boolean;
  parallax: HeroLyra3DProps["parallax"];
  reduceMotion: boolean;
}) {
  const gltf = useGLTF(LYRA_MODEL_URL) as {
    animations?: Array<{ name: string }>;
    scene: Group;
  };
  const groupRef = useRef<Group>(null);
  const armatureRef = useRef<Object3D | null>(null);
  const baseRotationsRef = useRef(new Map<Object3D, Euler>());
  const loggedFallbackRef = useRef(false);
  const bones = useMemo(() => findBoneCandidates(gltf.scene), [gltf.scene]);
  const morphTargets = useMemo(() => collectMorphTargets(gltf.scene), [gltf.scene]);

  useEffect(() => {
    gltf.scene.traverse((object) => {
      if (!armatureRef.current && /armature/i.test(object.name)) {
        armatureRef.current = object;
      }
    });

    logModelDiagnostics(gltf.scene, gltf.animations, bones, morphTargets);

    [bones.head, bones.neck, bones.chest, ...bones.eyes]
      .filter((bone): bone is Bone => Boolean(bone))
      .forEach((bone) => {
        if (!baseRotationsRef.current.has(bone)) {
          baseRotationsRef.current.set(bone, bone.rotation.clone());
        }
      });

    if (!bones.head && !bones.neck && bones.eyes.length === 0 && !loggedFallbackRef.current) {
      loggedFallbackRef.current = true;
      console.warn(
        "[HeroLyra3D] No head/eye bones found; using whole-model gaze fallback.",
      );
    }
  }, [bones, gltf.animations, gltf.scene, morphTargets]);

  useEffect(() => {
    if (!armatureRef.current) {
      return;
    }

    armatureRef.current.position.set(...HERO_ARMATURE_TRANSFORM.position);
    armatureRef.current.rotation.set(...HERO_ARMATURE_TRANSFORM.rotation);
    armatureRef.current.scale.setScalar(HERO_ARMATURE_TRANSFORM.scale);
  }, []);

  useFrame(({ clock }, delta) => {
    const breath = reduceMotion ? 0 : Math.sin(clock.elapsedTime * 1.45) * 0.022;
    const gazeX = MathUtils.clamp(parallax.x, -0.5, 0.5);
    const gazeY = MathUtils.clamp(parallax.y, -0.5, 0.5);
    const targetHeadY = gazeX * 0.34;
    const targetHeadX = -gazeY * 0.2;
    const targetNeckY = gazeX * 0.16;
    const targetNeckX = -gazeY * 0.08;
    const targetChestY = gazeX * 0.045;
    const targetEyeY = gazeX * 0.12;
    const targetEyeX = -gazeY * 0.08;
    const hasFaceBones = Boolean(bones.head || bones.neck || bones.eyes.length);

    if (bones.head) {
      const base = baseRotationsRef.current.get(bones.head) ?? bones.head.rotation;
      bones.head.rotation.y = MathUtils.damp(
        bones.head.rotation.y,
        base.y + (reduceMotion ? 0 : targetHeadY),
        5,
        delta,
      );
      bones.head.rotation.x = MathUtils.damp(
        bones.head.rotation.x,
        base.x + (reduceMotion ? 0 : targetHeadX),
        5,
        delta,
      );
    }

    if (bones.neck) {
      const base = baseRotationsRef.current.get(bones.neck) ?? bones.neck.rotation;
      bones.neck.rotation.y = MathUtils.damp(
        bones.neck.rotation.y,
        base.y + (reduceMotion ? 0 : targetNeckY),
        4.4,
        delta,
      );
      bones.neck.rotation.x = MathUtils.damp(
        bones.neck.rotation.x,
        base.x + (reduceMotion ? 0 : targetNeckX),
        4.4,
        delta,
      );
    }

    if (bones.chest) {
      const base = baseRotationsRef.current.get(bones.chest) ?? bones.chest.rotation;
      bones.chest.rotation.y = MathUtils.damp(
        bones.chest.rotation.y,
        base.y + (reduceMotion ? 0 : targetChestY),
        3.8,
        delta,
      );
      bones.chest.rotation.x = MathUtils.damp(
        bones.chest.rotation.x,
        base.x + breath,
        2.8,
        delta,
      );
    }

    bones.eyes.forEach((eye) => {
      const base = baseRotationsRef.current.get(eye) ?? eye.rotation;
      eye.rotation.y = MathUtils.damp(
        eye.rotation.y,
        base.y + (reduceMotion ? 0 : targetEyeY),
        6,
        delta,
      );
      eye.rotation.x = MathUtils.damp(
        eye.rotation.x,
        base.x + (reduceMotion ? 0 : targetEyeX),
        6,
        delta,
      );
    });

    if (!hasFaceBones && groupRef.current) {
      groupRef.current.rotation.y = MathUtils.damp(
        groupRef.current.rotation.y,
        HERO_MODEL_ROTATION[1] + (reduceMotion ? 0 : gazeX * 0.14),
        4.2,
        delta,
      );
      groupRef.current.rotation.x = MathUtils.damp(
        groupRef.current.rotation.x,
        HERO_MODEL_ROTATION[0] + (reduceMotion ? 0 : -gazeY * 0.045),
        4.2,
        delta,
      );
    }

    morphTargets.forEach((target) => {
      if (!target.mesh.morphTargetInfluences) {
        return;
      }

      const blinkPulse =
        target.type === "blink" && !reduceMotion
          ? Math.max(0, Math.sin(clock.elapsedTime * 1.1) - 0.985) * 22
          : 0;
      const expression =
        target.type === "smile" && isHovered && !reduceMotion ? 0.18 : blinkPulse;
      target.mesh.morphTargetInfluences[target.index] = MathUtils.damp(
        target.mesh.morphTargetInfluences[target.index] ?? 0,
        expression,
        7,
        delta,
      );
    });

    if (groupRef.current) {
      groupRef.current.position.x = HERO_MODEL_POSITION[0];
      groupRef.current.position.y = HERO_MODEL_POSITION[1] + breath * 0.7;
      groupRef.current.position.z = HERO_MODEL_POSITION[2];
      groupRef.current.scale.setScalar(
        isHovered ? HERO_MODEL_SCALE * 1.015 : HERO_MODEL_SCALE,
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={HERO_MODEL_POSITION}
      rotation={HERO_MODEL_ROTATION}
      scale={HERO_MODEL_SCALE}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

export function HeroLyra3D({ isExiting, parallax, reduceMotion }: HeroLyra3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cameraRef = useRef<ThreePerspectiveCamera | null>(null);

  return (
    <motion.div
      animate={{
        opacity: isExiting ? 0 : 1,
        x: reduceMotion ? 0 : parallax.x * 12,
        y: isExiting ? 20 : reduceMotion ? 0 : parallax.y * 10,
      }}
      aria-label="Lyra 3D companion"
      className="hero-lyra hero-lyra-3d"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 26 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={{ duration: reduceMotion ? 0 : 0.72, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="hero-lyra-shadow" />
      <ModelErrorBoundary>
        <Suspense
          fallback={<div className="hero-lyra-3d-fallback">Loading Lyra 3D...</div>}
        >
          <Canvas dpr={[1, 1.8]} gl={{ alpha: true, antialias: true }}>
            <DreiPerspectiveCamera
              ref={cameraRef}
              makeDefault
              fov={28}
              position={HERO_CAMERA_POSITION}
            />
            <ambientLight intensity={1.05} />
            <directionalLight intensity={2.4} position={[2.8, 4.2, 4]} />
            <pointLight color="#55a583" intensity={1.25} position={[-3, 1.8, 2.2]} />
            <pointLight color="#7b65c7" intensity={0.65} position={[2.8, 1.2, -1.5]} />
            <CameraRig
              isHovered={isHovered}
              reduceMotion={reduceMotion}
              cameraRef={cameraRef}
            />
            <LyraRiggedModel isHovered={isHovered} parallax={parallax} reduceMotion={reduceMotion} />
          </Canvas>
        </Suspense>
      </ModelErrorBoundary>
    </motion.div>
  );
}

useGLTF.preload(LYRA_MODEL_URL);
