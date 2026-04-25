import { Achievements } from "../../features/achievements";
import { CareerMatch } from "../../features/careerMatch";
import { CareerTrial } from "../../features/careerTrial";
import { InterestMap } from "../../features/interestMap";
import { Roadmap } from "../../features/roadmap";
import { useIslandStore } from "../../store";
import type { IslandDefinition } from "../../types";
import { IslandWindow } from "./IslandWindow";

function renderIslandContent(island: IslandDefinition) {
  switch (island.id) {
    case "interest-map":
      return <InterestMap island={island} />;
    case "achievements":
      return <Achievements island={island} />;
    case "roadmap":
      return <Roadmap island={island} />;
    case "career-match":
      return <CareerMatch island={island} />;
    case "career-trial":
      return <CareerTrial island={island} />;
    default:
      return null;
  }
}

export function IslandsLayer() {
  const islands = useIslandStore((state) => state.islands);
  const openIslands = useIslandStore((state) => state.openIslands);
  const activeIslandId = useIslandStore((state) => state.activeIslandId);
  const closeIsland = useIslandStore((state) => state.closeIsland);
  const focusIsland = useIslandStore((state) => state.focusIsland);
  const updateIslandLayout = useIslandStore((state) => state.updateIslandLayout);

  return (
    <div className="islands-layer" aria-label="Career insight islands">
      {Object.values(islands).map((island) =>
        openIslands[island.id] ? (
          <IslandWindow
            active={activeIslandId === island.id}
            island={island}
            key={island.id}
            onClose={closeIsland}
            onFocus={focusIsland}
            onLayoutChange={updateIslandLayout}
          >
            {renderIslandContent(island)}
          </IslandWindow>
        ) : null,
      )}
    </div>
  );
}
