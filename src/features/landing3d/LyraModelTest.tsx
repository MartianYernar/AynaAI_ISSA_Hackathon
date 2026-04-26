import { Component, Suspense, useEffect, type ReactNode } from "react";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { Group, Object3D } from "three";

const LYRA_MODEL_URL = "/characters3d/lyra-landing/lyra.glb";

class ModelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[LyraModelTest] Failed to load Lyra GLB.", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="lyra-model-test-fallback" role="alert">
          Lyra 3D model failed to load from {LYRA_MODEL_URL}.
        </div>
      );
    }

    return this.props.children;
  }
}

function collectBoneNames(root: Object3D) {
  const boneNames: string[] = [];

  root.traverse((object) => {
    if (object.type === "Bone") {
      boneNames.push(object.name || "(unnamed bone)");
    }
  });

  return boneNames;
}

function LyraModel() {
  const gltf = useGLTF(LYRA_MODEL_URL) as {
    scene: Group;
    animations: Array<{ name: string }>;
  };

  useEffect(() => {
    const boneNames = collectBoneNames(gltf.scene);
    const clipNames = gltf.animations.map((clip) => clip.name || "(unnamed clip)");

    console.info("[LyraModelTest] Bone names:", boneNames);
    console.info("[LyraModelTest] Animation clip names:", clipNames);
  }, [gltf]);

  return <primitive object={gltf.scene} position={[0, -1.15, 0]} scale={1.55} />;
}

export function LyraModelTest({ onExit }: { onExit: () => void }) {
  return (
    <main className="lyra-model-test" aria-labelledby="lyra-model-test-title">
      <header className="lyra-model-test-header">
        <div>
          <span>Temporary test viewer</span>
          <h1 id="lyra-model-test-title">Lyra GLB model test</h1>
          <p>Orbit, inspect, and check the browser console for bones and clips.</p>
        </div>
        <button onClick={onExit} type="button">
          Back to landing
        </button>
      </header>

      <section className="lyra-model-test-canvas" aria-label="Lyra 3D model canvas">
        <ModelErrorBoundary>
          <Suspense
            fallback={
              <div className="lyra-model-test-fallback">Loading Lyra 3D model...</div>
            }
          >
            <Canvas camera={{ fov: 36, position: [0, 1.1, 5.6] }}>
              <color args={["#f8f6f0"]} attach="background" />
              <ambientLight intensity={1.1} />
              <directionalLight intensity={2.2} position={[3, 4, 4]} />
              <pointLight color="#55a583" intensity={1.1} position={[-3, 2.4, 2]} />
              <LyraModel />
              <OrbitControls
                enableDamping
                maxDistance={10}
                minDistance={2.5}
                target={[0, 0.15, 0]}
              />
            </Canvas>
          </Suspense>
        </ModelErrorBoundary>
      </section>
    </main>
  );
}
