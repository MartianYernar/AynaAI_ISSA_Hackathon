import { Minus, X } from "lucide-react";
import { motion } from "framer-motion";
import { Rnd, type RndDragCallback, type RndResizeCallback } from "react-rnd";
import type { ReactNode, WheelEvent } from "react";
import type { IslandDefinition, IslandId } from "../../types";

interface IslandWindowProps {
  active: boolean;
  children: ReactNode;
  island: IslandDefinition;
  minimized: boolean;
  onClose: (islandId: IslandId) => void;
  onFocus: (islandId: IslandId) => void;
  onLayoutChange: (
    islandId: IslandId,
    layout: Partial<IslandDefinition["layout"]>,
  ) => void;
  onMinimize: (islandId: IslandId) => void;
}

export function IslandWindow({
  active,
  children,
  island,
  minimized,
  onClose,
  onFocus,
  onLayoutChange,
  onMinimize,
}: IslandWindowProps) {
  const displayHeight = minimized ? 74 : island.layout.height;

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

  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    const target = event.target;

    if (!(target instanceof HTMLElement) || target.closest(".island-content")) {
      return;
    }

    event.preventDefault();
    onFocus(island.id);

    const direction = event.deltaY < 0 ? 1 : -1;
    const nextWidth = Math.min(
      420,
      Math.max(230, island.layout.width + direction * 18),
    );
    const nextHeight = minimized
      ? island.layout.height
      : Math.min(340, Math.max(180, island.layout.height + direction * 14));

    onLayoutChange(island.id, {
      width: nextWidth,
      height: nextHeight,
    });
  };

  return (
    <Rnd
      bounds="parent"
      className={`island-window ${active ? "is-active" : ""} ${
        minimized ? "is-minimized" : ""
      }`}
      disableDragging={false}
      enableResizing={!minimized}
      minHeight={180}
      minWidth={230}
      onDragStart={() => onFocus(island.id)}
      onDragStop={handleDragStop}
      onMouseDown={() => onFocus(island.id)}
      onResizeStart={() => onFocus(island.id)}
      onResizeStop={handleResizeStop}
      position={{ x: island.layout.x, y: island.layout.y }}
      size={{ width: island.layout.width, height: displayHeight }}
    >
      <motion.article
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="island-card"
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        onWheel={handleWheel}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <header className="island-header">
          <div>
            <span>{island.eyebrow}</span>
            <h2>{island.title}</h2>
          </div>
          <div className="island-controls" aria-label={`${island.title} controls`}>
            <button
              aria-label={`Minimize ${island.title}`}
              className="window-dot"
              onClick={() => onMinimize(island.id)}
              type="button"
            >
              <Minus size={12} strokeWidth={1.8} />
            </button>
            <button
              aria-label={`Close ${island.title}`}
              className="window-dot"
              onClick={() => onClose(island.id)}
              type="button"
            >
              <X size={13} strokeWidth={1.8} />
            </button>
          </div>
        </header>
        {minimized ? null : children}
      </motion.article>
    </Rnd>
  );
}
