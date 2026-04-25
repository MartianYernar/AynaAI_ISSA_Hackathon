import { DesktopCharacter } from "./components/avatar";
import { FullscreenScene } from "./components/camera";
import { CommandBar } from "./components/command";
import { IslandNav, IslandsLayer } from "./components/islands";
import { useCharacterStore, useIslandStore } from "./store";
import type { IslandId } from "./types";
import "./styles/globals.css";

function App() {
  const openIsland = useIslandStore((state) => state.openIsland);
  const walkToIsland = useCharacterStore((state) => state.walkToIsland);
  const pointAtIsland = useCharacterStore((state) => state.pointAtIsland);
  const moveTo = useCharacterStore((state) => state.moveTo);

  const handleOpenIsland = (islandId: IslandId) => {
    openIsland(islandId);

    if (islandId === "roadmap") {
      walkToIsland(islandId);
      return;
    }

    if (islandId === "achievements") {
      pointAtIsland(islandId);
      return;
    }

    if (islandId === "career-trial") {
      moveTo(980, 690);
    }
  };

  return (
    <FullscreenScene>
      <IslandsLayer />
      <IslandNav onOpenIsland={handleOpenIsland} />
      <CommandBar onOpenIsland={handleOpenIsland} />
      <DesktopCharacter />
    </FullscreenScene>
  );
}

export default App;
