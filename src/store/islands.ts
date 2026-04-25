import { create } from "zustand";
import { islandDefinitions } from "../services";
import type { IslandDefinition, IslandId, IslandLayout } from "../types";

type IslandRecord = Record<IslandId, IslandDefinition>;
type IslandVisibility = Record<IslandId, boolean>;

interface IslandStore {
  islands: IslandRecord;
  openIslands: IslandVisibility;
  minimizedIslands: IslandVisibility;
  activeIslandId: IslandId;
  openIsland: (islandId: IslandId) => void;
  closeIsland: (islandId: IslandId) => void;
  focusIsland: (islandId: IslandId) => void;
  minimizeIsland: (islandId: IslandId) => void;
  updateIslandLayout: (islandId: IslandId, layout: Partial<IslandLayout>) => void;
}

const islands = islandDefinitions.reduce<IslandRecord>((record, island) => {
  record[island.id] = island;
  return record;
}, {} as IslandRecord);

const openIslands = islandDefinitions.reduce<IslandVisibility>((record, island) => {
  record[island.id] = false;
  return record;
}, {} as IslandVisibility);

const minimizedIslands = islandDefinitions.reduce<IslandVisibility>(
  (record, island) => {
    record[island.id] = false;
    return record;
  },
  {} as IslandVisibility,
);

export const useIslandStore = create<IslandStore>((set) => ({
  islands,
  openIslands,
  minimizedIslands,
  activeIslandId: "roadmap",
  openIsland: (islandId) =>
    set((state) => ({
      activeIslandId: islandId,
      openIslands: { ...state.openIslands, [islandId]: true },
      minimizedIslands: { ...state.minimizedIslands, [islandId]: false },
    })),
  closeIsland: (islandId) =>
    set((state) => ({
      activeIslandId:
        state.activeIslandId === islandId ? "roadmap" : state.activeIslandId,
      openIslands: { ...state.openIslands, [islandId]: false },
      minimizedIslands: { ...state.minimizedIslands, [islandId]: false },
    })),
  focusIsland: (islandId) => set({ activeIslandId: islandId }),
  minimizeIsland: (islandId) =>
    set((state) => ({
      activeIslandId: islandId,
      minimizedIslands: { ...state.minimizedIslands, [islandId]: true },
    })),
  updateIslandLayout: (islandId, layout) =>
    set((state) => ({
      islands: {
        ...state.islands,
        [islandId]: {
          ...state.islands[islandId],
          layout: { ...state.islands[islandId].layout, ...layout },
        },
      },
    })),
}));
