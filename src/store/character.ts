import { create } from "zustand";
import { useIslandStore } from "./islands";
import type { CharacterPosition, CharacterState, IslandId } from "../types";

interface CharacterStore {
  position: CharacterPosition;
  state: CharacterState;
  targetIslandId: IslandId | null;
  moveTo: (x: number, y: number) => void;
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
  moveTo: (x, y) =>
    set({
      position: { x, y },
      state: "walking",
      targetIslandId: null,
    }),
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
