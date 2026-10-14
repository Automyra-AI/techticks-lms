"use client";

import { createPortal } from "react-dom";

const COLORS = [
  "#2563eb", // brand blue
  "#7fd0bb", // mint
  "#f7b23b", // amber
  "#10b981", // green
  "#f87171", // coral
  "#a78bfa", // lilac
];

/**
 * A seeded generator, so the scatter is varied but deterministic. Random values
 * cannot be drawn during render — React requires render to be pure — so this
 * runs once at module load instead.
 */
function seeded(seed: number) {
  let v = seed;
  return () => {
    v = (v * 1664525 + 1013904223) % 4294967296;
    return v / 4294967296;
  };
}

const rand = seeded(20261015);
const COUNT = 140;

const RIBBONS = Array.from({ length: COUNT }, (_, i) => ({
  // Spread evenly across the full width, nudged so it doesn't look like a comb.
  left: (i / COUNT) * 100 + (rand() * 6 - 3),
  // Short, tight delays: the screen fills within half a second.
  delay: rand() * 0.9,
  duration: 2.6 + rand() * 2.2,
  drift: `${rand() * 200 - 100}px`,
  spin: `${480 + rand() * 900}deg`,
  color: COLORS[i % COLORS.length],
  width: 5 + rand() * 6,
  height: 12 + rand() * 18,
  round: rand() > 0.7,
}));

/**
 * Celebration streamers for a passed quiz — ribbons falling and tumbling across
 * the whole screen.
 *
 * Rendered through a portal to <body>: the quiz overlay uses backdrop-blur,
 * and a backdrop-filter makes an element a containing block for fixed-position
 * descendants, which would otherwise pin the ribbons inside the dialog instead
 * of the viewport.
 *
 * Dependency-free — each ribbon is a plain element whose inline values drive
 * one CSS keyframe (`confetti-fall` in globals.css), so it runs on the
 * compositor.
 */
export function Confetti({ pieces = COUNT }: { pieces?: number }) {
  // Only ever rendered inside the quiz overlay, which is itself portalled after
  // mount — so document exists by now and no mount guard state is needed.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="confetti-layer pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      {RIBBONS.slice(0, pieces).map((r, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${r.left}%`,
              width: `${r.width}px`,
              height: `${r.height}px`,
              background: r.color,
              borderRadius: r.round ? "999px" : "2px",
              animationDelay: `${r.delay}s`,
              animationDuration: `${r.duration}s`,
              "--drift": r.drift,
              "--spin": r.spin,
            } as React.CSSProperties
          }
        />
      ))}
    </div>,
    document.body
  );
}
