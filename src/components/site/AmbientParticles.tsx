/* Page-wide ambient layer: coffee beans tumbling slowly down the screen,
   warm embers drifting up, and a couple of soft steam wisps — one fixed
   layer, mounted once in app/page.tsx.

   Three nested elements per particle so three motions never share a
   transform: the outer .ap travels the screen on a gentle S-curve (not a
   straight line — feels like drifting air, not falling rain), the middle
   .ap-sway sways side to side, and the inner .ap-spin turns slowly. Pure
   CSS keyframes — costs nothing on the main thread.

   Deterministic per-index values (no Math.random): this renders on the
   server and in the browser, and random values would cause a hydration
   mismatch. */

import type { CSSProperties } from "react";

type Particle = {
  kind: "bean" | "ember" | "steam";
  left: number; // % of viewport width
  y: number; // % — static placement under reduced motion
  size: number; // px
  duration: number; // s
  delay: number; // s
  curve: number; // px — how far the S-curve bows sideways
  sway: number; // px
  swayDur: number; // s
  spinDur: number; // s
  spinDir: 1 | -1;
  depth: "near" | "far";
};

function frac(n: number) {
  return n - Math.floor(n);
}
function rand2(i: number, salt: number) {
  return frac(Math.sin((i + 1) * salt) * 43758.5453);
}

function makeParticles(): Particle[] {
  const beans = 16;
  const embers = 14;
  const steams = 4;
  return Array.from({ length: beans + embers + steams }, (_, i) => {
    const kind: Particle["kind"] = i < beans ? "bean" : i < beans + embers ? "ember" : "steam";
    const a = rand2(i, 12.9898);
    const b = rand2(i, 78.233);
    const c = rand2(i, 37.719);
    const d = rand2(i, 94.673);
    const far = b > 0.55; // ~45% sit "closer", the rest recede
    return {
      kind,
      left: a * 100,
      y: c * 100,
      size: kind === "bean" ? (far ? 8 : 13) + b * 8 : kind === "ember" ? (far ? 3 : 5) + b * 5 : 30 + b * 26,
      duration: kind === "steam" ? 13 + c * 6 : (far ? 30 : 20) + c * 20,
      delay: -(a * 46),
      curve: 40 + d * 90,
      sway: 12 + b * 30,
      swayDur: 4 + c * 5,
      spinDur: 7 + d * 10,
      spinDir: i % 2 === 0 ? 1 : -1,
      depth: far ? "far" : "near",
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
          className={`ap ${p.kind === "ember" ? "ap-rise" : p.kind === "steam" ? "ap-steam" : "ap-fall"}`}
          style={
            {
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--y": `${p.y}%`,
              "--curve": `${p.curve}px`,
              opacity: p.depth === "far" ? 0.4 : 0.75,
              filter: p.depth === "far" ? "blur(1px)" : "none",
            } as CSSProperties
          }
        >
          <span
            className="ap-sway"
            style={{ "--sway": `${p.sway}px`, animationDuration: `${p.swayDur}s` } as CSSProperties}
          >
            {p.kind === "bean" ? (
              <span
                className="ap-spin block"
                style={
                  {
                    animationDuration: `${p.spinDur}s`,
                    animationDirection: p.spinDir === 1 ? "normal" : "reverse",
                  } as CSSProperties
                }
              >
                <svg width={p.size} height={p.size * 1.4} viewBox="0 0 20 28" className="block">
                  <ellipse cx="10" cy="14" rx="8.5" ry="12.5" fill="var(--caffeine-gold)" />
                  <path
                    d="M10 2.5C3.5 10 16.5 18 10 25.5"
                    fill="none"
                    stroke="var(--caffeine-dark)"
                    strokeOpacity="0.55"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            ) : p.kind === "ember" ? (
              <span className="ap-ember block rounded-full" style={{ width: p.size, height: p.size }} />
            ) : (
              <span className="ap-steam-shape block rounded-full" style={{ width: p.size, height: p.size }} />
            )}
          </span>
        </span>
      ))}
    </div>
  );
}
