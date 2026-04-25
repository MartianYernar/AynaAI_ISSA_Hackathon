import type { ReactNode } from "react";
import { CameraBackground } from "../camera/CameraBackground";

interface FullscreenSceneProps {
  children: ReactNode;
}

export function FullscreenScene({ children }: FullscreenSceneProps) {
  return (
    <main className="scene-shell" aria-label="Ayna AI career mirror">
      <div className="camera-stage">
        <CameraBackground />
        {children}
      </div>
    </main>
  );
}
