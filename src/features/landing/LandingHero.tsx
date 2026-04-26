import { motion } from "framer-motion";
import { useEffect, useState, type MouseEvent } from "react";
import { HeroLines } from "./HeroLines";
import { HeroLyra } from "./HeroLyra";

interface LandingHeroProps {
  onStart: () => void;
}

export function LandingHero({ onStart }: LandingHeroProps) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [isStartHovered, setIsStartHovered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReduceMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (!isExiting) {
      return undefined;
    }

    const timeoutId = window.setTimeout(onStart, reduceMotion ? 80 : 520);
    return () => window.clearTimeout(timeoutId);
  }, [isExiting, onStart, reduceMotion]);

  const updateParallax = (event: MouseEvent<HTMLElement>) => {
    if (reduceMotion) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setParallax({
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    });
  };

  const startOnboarding = () => {
    if (isExiting) {
      return;
    }

    setIsExiting(true);
  };

  return (
    <motion.main
      animate={{ opacity: isExiting ? 0 : 1 }}
      className="landing-hero"
      initial={reduceMotion ? false : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.42, ease: "easeOut" }}
      aria-labelledby="landing-title"
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      onMouseMove={updateParallax}
    >
      <HeroLines
        isExiting={isExiting}
        parallax={parallax}
        reduceMotion={reduceMotion}
      />
      <section className="landing-hero-content">
        <motion.div
          animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 12 : 0 }}
          className="landing-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          transition={{ duration: reduceMotion ? 0 : 0.52, delay: 0.12 }}
        >
          <motion.span
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: isExiting ? 0 : 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, delay: 0.18 }}
          >
            Ayna AI companion
          </motion.span>
          <motion.h1
            id="landing-title"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 8 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.58, delay: 0.24 }}
          >
            A desktop guide for your next learning step.
          </motion.h1>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 8 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.52, delay: 0.34 }}
          >
            Meet Lyra, a persistent educational companion that helps students
            reflect on interests, organize achievements, and turn uncertainty
            into a clear roadmap.
          </motion.p>
          <motion.div
            className="landing-actions"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? 8 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.46, delay: 0.42 }}
          >
            <button
              disabled={isExiting}
              onClick={startOnboarding}
              onMouseEnter={() => setIsStartHovered(true)}
              onMouseLeave={() => setIsStartHovered(false)}
              type="button"
            >
              Start with Lyra
            </button>
            <button className="is-secondary" type="button">
              See how it works
            </button>
          </motion.div>
        </motion.div>

        <aside className="landing-visual" aria-label="Lyra preview">
          <div className="hero-depth-card card-one" />
          <div className="hero-depth-card card-two" />
          <HeroLyra
            isExiting={isExiting}
            isStartHovered={isStartHovered}
            parallax={parallax}
            reduceMotion={reduceMotion}
          />
        </aside>
      </section>
    </motion.main>
  );
}
