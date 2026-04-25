import {
  Brain,
  Mic,
  MousePointer2,
  Paperclip,
  Route,
  Send,
} from "lucide-react";
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
      <button
        aria-label="Upload portfolio evidence"
        className="command-icon-button"
        onClick={() => setCharacterState("thinking")}
        type="button"
      >
        <Paperclip size={18} strokeWidth={1.8} />
      </button>
      <div className="command-input-shell">
        <span>Ask Ayna to reflect on your next step</span>
      </div>
      <button
        aria-label="Start voice input"
        className="command-icon-button"
        onClick={() => setCharacterState("speaking")}
        type="button"
      >
        <Mic size={18} strokeWidth={1.8} />
      </button>
      <button
        aria-label="Send command"
        className="command-send-button"
        onClick={() => onOpenIsland("roadmap")}
        type="button"
      >
        <Send size={18} strokeWidth={1.8} />
      </button>
      <div className="command-divider" />
      <button className="command-action" onClick={() => onOpenIsland("roadmap")} type="button">
        <Route size={17} strokeWidth={1.8} />
        <span>Roadmap</span>
      </button>
      <button className="command-action" onClick={() => walkToIsland(activeIslandId)} type="button">
        <MousePointer2 size={17} strokeWidth={1.8} />
        <span>Visit active</span>
      </button>
      <button className="command-action" onClick={() => setCharacterState("thinking")} type="button">
        <Brain size={17} strokeWidth={1.8} />
        <span>Think</span>
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
