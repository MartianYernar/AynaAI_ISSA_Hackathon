import { create } from "zustand";
import { useIslandStore } from "./islands";
import type { CharacterPosition, CharacterState, IslandId } from "../types";

interface CharacterStore {
  position: CharacterPosition;
  state: CharacterState;
  targetIslandId: IslandId | null;
  setPosition: (x: number, y: number) => void;
  moveTo: (x: number, y: number) => void;
  startWorkspaceEntry: () => void;
  walkToIsland: (islandId: IslandId) => void;
  pointAtIsland: (islandId: IslandId) => void;
  setState: (state: CharacterState) => void;
}

const getNearIslandPosition = (islandId: IslandId): CharacterPosition => {
  const island = useIslandStore.getState().islands[islandId];
  return {
    x: island.layout.x + Math.min(island.layout.width * 0.5, 210),
    y: island.layout.y + island.layout.height + 56,
  };
};

export const useCharacterStore = create<CharacterStore>((set) => ({
  position: { x: 640, y: 620 },
  state: "idle",
  targetIslandId: null,
  setPosition: (x, y) =>
    set({
      position: { x, y },
      targetIslandId: null,
    }),
  moveTo: (x, y) =>
    set({
      position: { x, y },
      state: "walking",
      targetIslandId: null,
    }),
  startWorkspaceEntry: () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerPosition = {
      x: viewportWidth / 2,
      y: viewportHeight * 0.52,
    };
    const floorPosition = {
      x: viewportWidth / 2,
      y: Math.max(420, viewportHeight - 118),
    };

    set({
      position: centerPosition,
      state: "landing",
      targetIslandId: null,
    });

    window.setTimeout(() => {
      set({
        position: floorPosition,
        state: "walking",
        targetIslandId: null,
      });
    }, 620);

    window.setTimeout(() => {
      set({ state: "idle" });
    }, 1560);
  },
  walkToIsland: (islandId) =>
    set({
      position: getNearIslandPosition(islandId),
      state: "walking",
      targetIslandId: islandId,
    }),
  pointAtIsland: (islandId) =>
    set({
      position: getNearIslandPosition(islandId),
      state: "pointing",
      targetIslandId: islandId,
    }),
  setState: (state) => set({ state }),
}));
