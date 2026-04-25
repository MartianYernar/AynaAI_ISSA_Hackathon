import type { MouseEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { useWorkspaceStore } from "../../store";

interface WorkspacePlaneProps {
  children: ReactNode;
}

export function WorkspacePlane({ children }: WorkspacePlaneProps) {
  const pan = useWorkspaceStore((state) => state.pan);
  const panBy = useWorkspaceStore((state) => state.panBy);
  const [isPanning, setIsPanning] = useState(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 1) {
      return;
    }

    event.preventDefault();
    setIsPanning(true);
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!isPanning) {
      return;
    }

    const deltaX = event.clientX - lastPointerRef.current.x;
    const deltaY = event.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    panBy(deltaX, deltaY);
  };

  const stopPanning = () => setIsPanning(false);

  return (
    <div
      className={`workspace-viewport ${isPanning ? "is-panning" : ""}`}
      onMouseDown={handleMouseDown}
      onMouseLeave={stopPanning}
      onMouseMove={handleMouseMove}
      onMouseUp={stopPanning}
    >
      <div
        className="workspace-plane"
        style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0)` }}
      >
        {children}
      </div>
    </div>
  );
}
