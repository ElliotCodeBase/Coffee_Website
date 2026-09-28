/* Cozy ambient dust/steam layer for the hero+about panel. Pure CSS
   keyframes (animate skill: "cheapest tool that works" — a handful of
   floating motes is predetermined motion, not something that needs a
   JS animation loop or a library) so it costs nothing on the main
   thread and runs identically on phones and desktops.

   Deterministic per-index values (no Math.random): this file is
   imported by HeroStory.tsx, a "use client" component, so it renders
   on both the server and the browser — Math.random() here would
   produce different values each time and trigger a hydration mismatch.
   A sine-based pseudo-random spread is stable across both renders. */

import type { CSSProperties } from "react";

type Particle = {
  left: number; // vw, 0–100
  top: number; // % of the container height, 0–92
  size: number; // px
  duration: number; // s
  delay: number; // s
  drift: number; // px of horizontal wobble
};

const PARTICLE_COUNT = 14;

function seededParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const a = Math.sin(i * 12.9898) * 43758.5453;
    const b = Math.sin(i * 78.233) * 12543.112;
    const c = Math.sin(i * 37.719) * 26123.231;
    const frac = (n: number) => n - Math.floor(n);
    return {
      left: frac(a) * 100,
      top: frac(c) * 92,
      size: 3 + frac(b) * 5,
      duration: 10 + frac(a * b) * 10,
      delay: frac(b - a) * 12,
      drift: (frac(a + b) - 0.5) * 30,
    };
  });
}

const PARTICLES = seededParticles(PARTICLE_COUNT);

export default function AmbientParticles({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`ambient-particles pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="ambient-particle"
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${-p.delay}s`,
              // consumed by the @keyframes in globals.css
              "--drift": `${p.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
