import { Brain, MessageCircle, MousePointer2, Route } from "lucide-react";
import { useCharacterStore, useIslandStore } from "../../store";
import type { CharacterState, IslandId } from "../../types";

interface CommandBarProps {
  onOpenIsland: (islandId: IslandId) => void;
}

const characterStates: CharacterState[] = [
  "idle",
  "thinking",
  "speaking",
  "pointing",
];

export function CommandBar({ onOpenIsland }: CommandBarProps) {
  const setCharacterState = useCharacterStore((state) => state.setState);
  const walkToIsland = useCharacterStore((state) => state.walkToIsland);
  const activeIslandId = useIslandStore((state) => state.activeIslandId);

  return (
    <div className="command-bar" aria-label="Ayna AI command bar">
      <button onClick={() => onOpenIsland("roadmap")} type="button">
        <Route size={17} strokeWidth={1.8} />
        <span>Roadmap</span>
      </button>
      <button onClick={() => walkToIsland(activeIslandId)} type="button">
        <MousePointer2 size={17} strokeWidth={1.8} />
        <span>Visit active</span>
      </button>
      <button onClick={() => setCharacterState("thinking")} type="button">
        <Brain size={17} strokeWidth={1.8} />
        <span>Think</span>
      </button>
      <button onClick={() => setCharacterState("speaking")} type="button">
        <MessageCircle size={17} strokeWidth={1.8} />
        <span>Speak</span>
      </button>
      <div className="state-pills" aria-label="Character states">
        {characterStates.map((state) => (
          <button key={state} onClick={() => setCharacterState(state)} type="button">
            {state}
          </button>
        ))}
      </div>
    </div>
  );
}
