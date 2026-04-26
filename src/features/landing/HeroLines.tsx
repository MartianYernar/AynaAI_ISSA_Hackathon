import { motion } from "framer-motion";

interface HeroLinesProps {
  parallax: {
    x: number;
    y: number;
  };
  reduceMotion: boolean;
  isExiting: boolean;
}

const paths = [
  "M-40 150 C 180 80, 320 210, 540 120 S 880 40, 1180 150",
  "M40 360 C 260 260, 430 380, 650 300 S 980 220, 1240 340",
  "M-80 520 C 220 470, 360 620, 650 520 S 980 420, 1300 520",
  "M120 80 C 340 150, 520 20, 780 88 S 1010 190, 1220 110",
  "M80 690 C 310 610, 560 700, 820 620 S 1040 560, 1260 650",
  "M-20 250 C 160 310, 390 190, 610 250 S 900 360, 1160 270",
];

const sparks = [
  { cx: 210, cy: 132, delay: "0s" },
  { cx: 520, cy: 292, delay: "0.7s" },
  { cx: 830, cy: 104, delay: "1.1s" },
  { cx: 960, cy: 440, delay: "1.8s" },
  { cx: 350, cy: 548, delay: "2.3s" },
  { cx: 1120, cy: 248, delay: "2.9s" },
  { cx: 690, cy: 668, delay: "3.4s" },
];

export function HeroLines({ isExiting, parallax, reduceMotion }: HeroLinesProps) {
  const transform = reduceMotion
    ? undefined
    : `translate3d(${parallax.x * 10}px, ${parallax.y * 8}px, 0)`;

  return (
    <motion.div
      animate={{ opacity: isExiting ? 0 : 1 }}
      className="hero-lines"
      initial={reduceMotion ? false : { opacity: 0 }}
      style={{ transform }}
      transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1280 760" preserveAspectRatio="none">
        <defs>
          <linearGradient id="heroLineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(85, 165, 131, 0)" />
            <stop offset="42%" stopColor="rgba(85, 165, 131, 0.42)" />
            <stop offset="68%" stopColor="rgba(123, 101, 199, 0.32)" />
            <stop offset="100%" stopColor="rgba(123, 101, 199, 0)" />
          </linearGradient>
        </defs>
        {paths.map((path, index) => (
          <path
            className={`hero-light-path path-${index + 1}`}
            d={path}
            key={path}
            pathLength="1"
          />
        ))}
        {sparks.map((spark, index) => (
          <circle
            className={`hero-spark spark-${index + 1}`}
            cx={spark.cx}
            cy={spark.cy}
            key={`${spark.cx}-${spark.cy}`}
            r="2.4"
            style={{ animationDelay: spark.delay }}
          />
        ))}
      </svg>
    </motion.div>
  );
}
