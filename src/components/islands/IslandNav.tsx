import {
  Award,
  Compass,
  Map,
  Milestone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useIslandStore } from "../../store";
import type { IslandId } from "../../types";

interface IslandNavProps {
  onOpenIsland: (islandId: IslandId) => void;
}

const islandIcons: Record<IslandId, LucideIcon> = {
  "interest-map": Map,
  achievements: Award,
  roadmap: Milestone,
  "career-match": Compass,
  "career-trial": Sparkles,
};

export function IslandNav({ onOpenIsland }: IslandNavProps) {
  const islands = useIslandStore((state) => state.islands);
  const openIslands = useIslandStore((state) => state.openIslands);
  const activeIslandId = useIslandStore((state) => state.activeIslandId);

  return (
    <nav className="island-nav" aria-label="Open career islands">
      {Object.values(islands).map((island) => {
        const Icon = islandIcons[island.id];
        const selected = activeIslandId === island.id && openIslands[island.id];
        return (
          <button
            aria-label={`Open ${island.title}`}
            className={selected ? "is-selected" : ""}
            key={island.id}
            onClick={() => onOpenIsland(island.id)}
            title={island.title}
            type="button"
          >
            <Icon size={18} strokeWidth={1.75} />
            <span>{island.title}</span>
          </button>
        );
      })}
    </nav>
  );
}
