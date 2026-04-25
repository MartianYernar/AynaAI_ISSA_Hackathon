import type { ReactNode } from "react";

interface FullscreenSceneProps {
  children: ReactNode;
}

export function FullscreenScene({ children }: FullscreenSceneProps) {
  return (
    <main className="scene-shell" aria-label="Ayna AI career mirror">
      <div className="camera-stage">
        <div className="camera-feed" aria-hidden="true">
          <span>Camera preview</span>
        </div>
        {children}
      </div>
    </main>
  );
}
