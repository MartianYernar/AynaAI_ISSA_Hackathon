import { create } from "zustand";

interface WorkspacePan {
  x: number;
  y: number;
}

interface WorkspaceStore {
  pan: WorkspacePan;
  panBy: (deltaX: number, deltaY: number) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  pan: { x: 0, y: 0 },
  panBy: (deltaX, deltaY) =>
    set((state) => ({
      pan: {
        x: state.pan.x + deltaX,
        y: state.pan.y + deltaY,
      },
    })),
}));
