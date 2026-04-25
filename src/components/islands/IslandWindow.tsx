import { X } from "lucide-react";
import { Rnd, type RndDragCallback, type RndResizeCallback } from "react-rnd";
import type { ReactNode } from "react";
import type { IslandDefinition, IslandId } from "../../types";

interface IslandWindowProps {
  active: boolean;
  children: ReactNode;
  island: IslandDefinition;
  onClose: (islandId: IslandId) => void;
  onFocus: (islandId: IslandId) => void;
  onLayoutChange: (
    islandId: IslandId,
    layout: Partial<IslandDefinition["layout"]>,
  ) => void;
}

export function IslandWindow({
  active,
  children,
  island,
  onClose,
  onFocus,
  onLayoutChange,
}: IslandWindowProps) {
  const handleDragStop: RndDragCallback = (_event, data) => {
    onLayoutChange(island.id, { x: data.x, y: data.y });
  };

  const handleResizeStop: RndResizeCallback = (
    _event,
    _direction,
    ref,
    _delta,
    position,
  ) => {
    onLayoutChange(island.id, {
      x: position.x,
      y: position.y,
      width: ref.offsetWidth,
      height: ref.offsetHeight,
    });
  };

  return (
    <Rnd
      bounds="parent"
      className={`island-window ${active ? "is-active" : ""}`}
      minHeight={230}
      minWidth={280}
      onDragStart={() => onFocus(island.id)}
      onDragStop={handleDragStop}
      onMouseDown={() => onFocus(island.id)}
      onResizeStart={() => onFocus(island.id)}
      onResizeStop={handleResizeStop}
      position={{ x: island.layout.x, y: island.layout.y }}
      size={{ width: island.layout.width, height: island.layout.height }}
    >
      <article className="island-card">
        <header className="island-header">
          <div>
            <span>{island.eyebrow}</span>
            <h2>{island.title}</h2>
          </div>
          <button
            aria-label={`Close ${island.title}`}
            className="icon-button"
            onClick={() => onClose(island.id)}
            type="button"
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </header>
        {children}
      </article>
    </Rnd>
  );
}
