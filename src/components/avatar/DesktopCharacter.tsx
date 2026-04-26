import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { loadCharacters } from "../../services";
import { useCharacterStore } from "../../store";
import type { CharacterManifest } from "../../types";
import { CharacterRenderer } from "./CharacterRenderer";

export function DesktopCharacter() {
  const position = useCharacterStore((state) => state.position);
  const characterState = useCharacterStore((state) => state.state);
  const setState = useCharacterStore((state) => state.setState);
  const [manifest, setManifest] = useState<CharacterManifest | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;

    loadCharacters()
      .then((characters) => {
        if (!active) {
          return;
        }

        setManifest(
          characters.find((character) => character.id === "lyra") ??
            characters[0] ??
            null,
        );
      })
      .catch(() => {
        if (active) {
          setLoadFailed(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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
      transition={{ duration: 0.92, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="character-shadow" />
      {loadFailed ? (
        <div className="character-missing">Character assets missing</div>
      ) : (
        <CharacterRenderer manifest={manifest} state={characterState} />
      )}
      {characterState === "thinking" ? <div className="thought-dot" /> : null}
      {characterState === "speaking" ? <div className="speech-mark" /> : null}
    </motion.div>
  );
}
