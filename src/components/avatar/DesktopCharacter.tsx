import { motion } from "framer-motion";
import { useEffect } from "react";
import { useCharacterStore } from "../../store";

export function DesktopCharacter() {
  const position = useCharacterStore((state) => state.position);
  const characterState = useCharacterStore((state) => state.state);
  const setState = useCharacterStore((state) => state.setState);

  useEffect(() => {
    if (characterState !== "walking") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setState("idle"), 760);
    return () => window.clearTimeout(timeoutId);
  }, [characterState, setState]);

  return (
    <motion.div
      animate={{ left: position.x, top: position.y }}
      className={`desktop-character is-${characterState}`}
      initial={false}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="character-shadow" />
      <div className="character-body">
        <div className="character-head">
          <div className="character-face">
            <span />
            <span />
          </div>
        </div>
        <div className="character-torso">
          <div className="character-arm character-arm-left" />
          <div className="character-arm character-arm-right" />
        </div>
        <div className="character-legs">
          <div />
          <div />
        </div>
      </div>
      {characterState === "thinking" ? <div className="thought-dot" /> : null}
      {characterState === "speaking" ? <div className="speech-mark" /> : null}
    </motion.div>
  );
}
