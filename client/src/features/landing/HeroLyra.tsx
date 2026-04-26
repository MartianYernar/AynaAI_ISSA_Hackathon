import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CharacterRenderer } from "../../components/avatar";
import { loadCharacters } from "../../services";
import type { CharacterManifest, CharacterState } from "../../types";

interface HeroLyraProps {
  isStartHovered: boolean;
  parallax: {
    x: number;
    y: number;
  };
  reduceMotion: boolean;
  isExiting: boolean;
}

export function HeroLyra({
  isExiting,
  isStartHovered,
  parallax,
  reduceMotion,
}: HeroLyraProps) {
  const [manifest, setManifest] = useState<CharacterManifest | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const state: CharacterState = isStartHovered ? "pointing" : "greet";

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

  return (
    <motion.div
      animate={{
        opacity: isExiting ? 0 : 1,
        rotate: reduceMotion ? 0 : parallax.x * 3.5,
        scale: isExiting
          ? 0.98
          : reduceMotion
            ? 1
            : 1.02 + Math.abs(parallax.y) * 0.025,
        x: reduceMotion ? 0 : parallax.x * 22,
        y: isExiting ? 20 : reduceMotion ? 0 : parallax.y * 16,
      }}
      className="hero-lyra"
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 26 }}
      transition={{ duration: reduceMotion ? 0 : 0.72, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Lyra companion"
    >
      <div className="hero-lyra-shadow" />
      {loadFailed ? (
        <div className="character-missing">Character assets missing</div>
      ) : (
        <CharacterRenderer manifest={manifest} state={state} />
      )}
    </motion.div>
  );
}
