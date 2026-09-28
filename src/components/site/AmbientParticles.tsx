/* Page-wide ambient layer: coffee beans tumbling slowly down the screen
   and warm embers drifting up, one fixed layer mounted once in app/page.tsx.

   Two nested elements per particle so two motions never share a transform:
   the outer span travels the screen (linear, transform + opacity), the
   inner span sways and turns (ease-in-out, alternating). Pure CSS keyframes,
   so it costs nothing on the main thread.

   Deterministic per-index values (no Math.random): this renders on the
   server and in the browser, and random values would cause a hydration
   mismatch. */

import type { CSSProperties } from "react";

type Particle = {
  kind: "bean" | "ember";
  left: number; // % of viewport width
  y: number; // % — only used under reduced motion (static placement)
  size: number; // px
  duration: number; // s
  delay: number; // s
  sway: number; // px
  swayDur: number; // s
  rot: number; // deg
};

function frac(n: number) {
  return n - Math.floor(n);
}

function makeParticles(): Particle[] {
  const beans = 14;
  const embers = 12;
  return Array.from({ length: beans + embers }, (_, i) => {
    const a = frac(Math.sin((i + 1) * 12.9898) * 43758.5453);
    const b = frac(Math.sin((i + 1) * 78.233) * 12543.112);
    const c = frac(Math.sin((i + 1) * 37.719) * 26123.231);
    const bean = i < beans;
    return {
      kind: bean ? "bean" : "ember",
      left: a * 100,
      y: c * 100,
      size: bean ? 11 + b * 11 : 4 + b * 6,
      duration: bean ? 24 + c * 22 : 16 + c * 14,
      delay: -(a * 40),
      sway: 14 + b * 34,
      swayDur: 4 + c * 5,
      rot: bean ? 25 + a * 70 : 0,
    };
  });
}

const PARTICLES = makeParticles();

export default function AmbientParticles({ className = "z-40" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`ambient-particles pointer-events-none fixed inset-0 overflow-hidden ${className}`}>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={`ap ${p.kind === "bean" ? "ap-fall" : "ap-rise"}`}
          style={
            {
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--y": `${p.y}%`,
            } as CSSProperties
          }
        >
          <span
            className="ap-sway"
            style={
              {
                "--sway": `${p.sway}px`,
                "--rot": `${p.rot}deg`,
                animationDuration: `${p.swayDur}s`,
              } as CSSProperties
            }
          >
            {p.kind === "bean" ? (
              <svg width={p.size} height={p.size * 1.4} viewBox="0 0 20 28" className="block">
                <ellipse cx="10" cy="14" rx="8.5" ry="12.5" fill="var(--caffeine-gold)" />
                <path d="M10 2.5C3.5 10 16.5 18 10 25.5" fill="none" stroke="var(--caffeine-dark)" strokeOpacity="0.55" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <span className="ap-ember block rounded-full" style={{ width: p.size, height: p.size }} />
            )}
          </span>
        </span>
      ))}
    </div>
  );
}
