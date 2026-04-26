import { useEffect, useState, type MouseEvent } from "react";
import { HeroLines } from "./HeroLines";
import { HeroLyra } from "./HeroLyra";

interface LandingHeroProps {
  onStart: () => void;
}

export function LandingHero({ onStart }: LandingHeroProps) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [isStartHovered, setIsStartHovered] = useState(false);
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

  return (
    <main
      className="landing-hero"
      aria-labelledby="landing-title"
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
      onMouseMove={updateParallax}
    >
      <HeroLines />
      <section className="landing-hero-content">
        <div className="landing-copy">
          <span>Ayna AI companion</span>
          <h1 id="landing-title">A desktop guide for your next learning step.</h1>
          <p>
            Meet Lyra, a persistent educational companion that helps students
            reflect on interests, organize achievements, and turn uncertainty
            into a clear roadmap.
          </p>
          <div className="landing-actions">
            <button
              onClick={onStart}
              onMouseEnter={() => setIsStartHovered(true)}
              onMouseLeave={() => setIsStartHovered(false)}
              type="button"
            >
              Start with Lyra
            </button>
            <button className="is-secondary" type="button">
              See how it works
            </button>
          </div>
        </div>

        <aside className="landing-visual" aria-label="Lyra preview">
          <div className="hero-depth-card card-one" />
          <div className="hero-depth-card card-two" />
          <HeroLyra
            isStartHovered={isStartHovered}
            parallax={parallax}
            reduceMotion={reduceMotion}
          />
        </aside>
      </section>
    </main>
  );
}
