"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";

/* Milk-drip edge under "Our Story".

   What changed and why:
   - The old version drew each drip as a flat-sided rectangle with a round
     cap and animated a *separate* rectangle on top of it, so the animated
     drips looked like thin sticks poking out of fatter ones. Now every drip
     is ONE closed path with a wide mouth, a pinched neck and a heavy bulb
     (a real hanging-drop profile), and the animation morphs that path.
   - The old SVG clipped everything below its viewBox, so long stems and the
     falling drops were cut off. The SVG now has overflow: visible and the
     drops fall out over the Menu.
   - The milk's top edge and its lower edge are both wavy, and the top
     overlaps the bottom of the story panel so the milk reads as poured
     over it instead of butted against it.
   - Motion is SMIL (<animate>) so the stem and the drop that pinches off of
     it share one clock and can never drift apart; it pauses while off
     screen and is switched off for prefers-reduced-motion.

   Geometry is seeded (deterministic) so server and browser render the same
   markup. Colour is var(--caffeine-drip), editable in Admin → Theme. */

const W = 1440;
const H = 300;
const TOP_MAX = 25; // lowest point of the wavy top edge, in viewBox units
const STEP = 8;

const topY = (x: number) => 14 + 7 * Math.sin(x / 131 + 2.1) + 4 * Math.sin(x / 57 + 0.7);
const baseY = (x: number) =>
  66 + 9 * Math.sin(x / 97 + 1.3) + 6 * Math.sin(x / 43 + 0.4) + 3 * Math.sin(x / 211);

const f = (n: number) => Math.round(n * 10) / 10;

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

type Kind = "drop" | "breathe" | "still";
type Shape = { L: number; h: number; r: number };
type Drip = {
  cx: number;
  m: number; // half-width of the mouth where it leaves the band
  rest: Shape;
  kind: Kind;
  e: number; // how far it can stretch
  dur: number;
  begin: number;
  fall: number;
};

function makeDrips(): Drip[] {
  const rand = rng(29);
  const out: Drip[] = [];
  let x = 8 + rand() * 20;
  for (;;) {
    const m = 20 + rand() * 14;
    const cx = x + m;
    if (cx + m > W - 6) break;
    const stub = rand() < 0.22;
    const L = stub ? 24 + rand() * 18 : 52 + Math.pow(rand(), 1.35) * 128;
    const r = Math.min(9 + rand() * 8, L * 0.26);
    const h = stub ? r * 0.92 : Math.max(4.5, r * (0.42 + rand() * 0.14));
    out.push({
      cx,
      m,
      rest: { L, h, r },
      kind: stub ? "still" : "breathe",
      e: 10 + rand() * 14,
      dur: 8 + rand() * 6,
      begin: -rand() * 12,
      fall: 120 + rand() * 40,
    });
    x = cx + m + 6 + rand() * 46;
  }
  // The longest drips, spread across the width, get the full stretch → pinch → fall.
  let last = -1e9;
  out.forEach((d) => {
    if (d.rest.L >= 95 && d.cx - last > 150 && d.kind !== "still") {
      d.kind = "drop";
      d.e = 42 + rand() * 28;
      d.dur = 13 + rand() * 7;
      last = d.cx;
    }
  });
  return out;
}

const DRIPS = makeDrips();

/* One drip as a closed path. Starts on the right of the mouth, sweeps into
   the neck, swells into the bulb, rounds the tip, and comes back up the left
   side. `up` adds a hidden tab inside the band so the shape overlaps the
   band and there is never a seam. */
function dripPath(cx: number, m: number, { L, h, r }: Shape): string {
  const yr = baseY(cx + m) - 0.5;
  const yl = baseY(cx - m) - 0.5;
  const y0 = baseY(cx);
  const tip = y0 + L - r; // centre of the bulb
  const neck = y0 + (tip - y0) * 0.55;
  const span = tip - neck;
  return [
    `M${f(cx + m)} ${f(yr - 14)}`,
    `L${f(cx + m)} ${f(yr)}`,
    `C${f(cx + m * 0.5)} ${f(yr + 2)} ${f(cx + h)} ${f(neck - (neck - yr) * 0.55)} ${f(cx + h)} ${f(neck)}`,
    `C${f(cx + h)} ${f(neck + span * 0.45)} ${f(cx + r)} ${f(tip - span * 0.35)} ${f(cx + r)} ${f(tip)}`,
    `A${f(r)} ${f(r)} 0 0 1 ${f(cx - r)} ${f(tip)}`,
    `C${f(cx - r)} ${f(tip - span * 0.35)} ${f(cx - h)} ${f(neck + span * 0.45)} ${f(cx - h)} ${f(neck)}`,
    `C${f(cx - h)} ${f(neck - (neck - yl) * 0.55)} ${f(cx - m * 0.5)} ${f(yl + 2)} ${f(cx - m)} ${f(yl)}`,
    `L${f(cx - m)} ${f(yl - 14)}Z`,
  ].join("");
}

const bulbY = (cx: number, { L, r }: Shape) => baseY(cx) + L - r;

/* Wavy milk body: top crest, right edge, wavy lower edge (drips hang from it). */
function bodyPath(): string {
  const p: string[] = [`M0 ${f(topY(0))}`];
  for (let x = STEP; x < W; x += STEP) p.push(`L${x} ${f(topY(x))}`);
  p.push(`L${W} ${f(topY(W))}L${W} ${f(baseY(W))}`);
  for (let x = W - STEP; x > 0; x -= STEP) p.push(`L${x} ${f(baseY(x))}`);
  p.push(`L0 ${f(baseY(0))}Z`);
  return p.join("");
}

function sheenPath(): string {
  const p: string[] = [`M0 ${f(topY(0) + 7)}`];
  for (let x = STEP; x <= W; x += STEP) p.push(`L${x} ${f(topY(x) + 7)}`);
  return p.join("");
}

const BODY = bodyPath();
const SHEEN = sheenPath();

/* Animation tracks per drip. (SMIL rule: with calcMode linear/spline the
   keyTimes list must start at 0 and END AT 1 — otherwise the browser
   silently drops the whole animation, which is exactly what stopped the
   falling drop from ever appearing.) */
type Track = { keyTimes: number[]; splines: string[]; shapes: Shape[] };

function trackFor(d: Drip): Track | null {
  const { L, h, r } = d.rest;
  const e = d.e;
  if (d.kind === "breathe") {
    return {
      keyTimes: [0, 0.5, 1],
      splines: ["0.45 0 0.55 1", "0.45 0 0.55 1"],
      shapes: [
        d.rest,
        { L: L + e, h: h * 0.86, r: r * 1.1 },
        d.rest,
      ],
    };
  }
  if (d.kind === "drop") {
    return {
      keyTimes: [0, 0.3, 0.62, 0.7, 0.8, 1],
      splines: ["0.4 0 0.6 1", "0.4 0 0.6 1", "0.15 0.85 0.3 1", "0.4 0 0.6 1", "0.4 0 0.6 1"],
      shapes: [
        d.rest,
        { L: L + e * 0.35, h: h * 0.92, r: r * 1.12 }, // slow swell
        { L: L + e, h: h * 0.58, r: r * 1.32 }, // stretched, neck thinning
        { L: L - 4, h: h * 1.05, r: Math.max(h * 1.1, r * 0.8) }, // snaps back after the pinch
        { L: L + e * 0.1, h: h * 1.02, r }, // small rebound
        d.rest,
      ],
    };
  }
  return null;
}

const NO_SPLINE = "0 0 1 1";

function DripShape({ d, still }: { d: Drip; still: boolean }) {
  const track = still ? null : trackFor(d);
  const rest = dripPath(d.cx, d.m, d.rest);
  const glint = { cx: d.cx - d.rest.r * 0.4, rx: d.rest.r * 0.2, ry: d.rest.r * 0.36 };
  const glintY = (s: Shape) => f(bulbY(d.cx, s) - s.r * 0.3);

  if (!track) {
    return (
      <g>
        <path d={rest} fill="url(#milk)" />
        <ellipse cx={f(glint.cx)} cy={glintY(d.rest)} rx={f(glint.rx)} ry={f(glint.ry)} fill="#fff" opacity="0.5" />
      </g>
    );
  }

  const kt = track.keyTimes.join(";");
  const timing = { dur: `${f(d.dur)}s`, begin: `${f(d.begin)}s`, repeatCount: "indefinite" } as const;
  const drop = d.kind === "drop";
  const peak = track.shapes[2];
  const dropR = peak.r;
  const dropY = bulbY(d.cx, peak);

  return (
    <g>
      <path d={rest} fill="url(#milk)">
        <animate
          attributeName="d"
          values={track.shapes.map((s) => dripPath(d.cx, d.m, s)).join(";")}
          keyTimes={kt}
          calcMode="spline"
          keySplines={track.splines.join(";")}
          {...timing}
        />
      </path>
      <ellipse cx={f(glint.cx)} cy={glintY(d.rest)} rx={f(glint.rx)} ry={f(glint.ry)} fill="#fff" opacity="0.5">
        <animate
          attributeName="cy"
          values={track.shapes.map(glintY).join(";")}
          keyTimes={kt}
          calcMode="spline"
          keySplines={track.splines.join(";")}
          {...timing}
        />
      </ellipse>

      {drop && (
        <ellipse cx={f(d.cx)} cy={f(dropY)} rx={f(dropR)} ry={f(dropR * 1.08)} fill="url(#milk)" opacity="0">
          {/* Appears exactly where the stretched bulb was, at the pinch… */}
          <animate
            attributeName="opacity"
            values="0;0;1;1;0;0"
            keyTimes="0;0.62;0.621;0.88;0.97;1"
            calcMode="linear"
            {...timing}
          />
          {/* …hangs for a beat, then falls with real acceleration… */}
          <animate
            attributeName="cy"
            values={`${f(dropY)};${f(dropY)};${f(dropY + 6)};${f(dropY + d.fall)};${f(dropY + d.fall)}`}
            keyTimes="0;0.62;0.66;0.97;1"
            calcMode="spline"
            keySplines={`${NO_SPLINE};0.3 0 0.5 1;0.55 0 0.95 0.6;${NO_SPLINE}`}
            {...timing}
          />
          {/* …stretching taller as it speeds up. */}
          <animate
            attributeName="ry"
            values={`${f(dropR * 1.08)};${f(dropR * 1.08)};${f(dropR * 1.1)};${f(dropR * 1.7)};${f(dropR * 1.7)}`}
            keyTimes="0;0.62;0.66;0.97;1"
            calcMode="linear"
            {...timing}
          />
        </ellipse>
      )}
    </g>
  );
}

const OVERLAP = `calc(max(100vw, 900px) * ${TOP_MAX / W})`;

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getReducedServer = () => false;

export default function DripEdge() {
  const svgRef = useRef<SVGSVGElement>(null);
  const still = useSyncExternalStore(subscribeReduced, getReduced, getReducedServer);

  /* No point animating (or paying for) drips nobody can see. */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) svg.unpauseAnimations?.();
        else svg.pauseAnimations?.();
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(svg);
    return () => io.disconnect();
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative z-10 block overflow-x-clip leading-[0]"
      style={
        {
          "--ov": OVERLAP,
          /* Pull the wavy crest up over the bottom of the story panel… */
          marginTop: "calc(var(--ov) * -1)",
          /* …and only paint the dark backdrop from the panel's edge down. */
          background: "linear-gradient(to bottom, transparent var(--ov), var(--caffeine-dark) var(--ov))",
        } as CSSProperties
      }
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="relative block h-auto max-w-none"
        style={{ width: "max(100%, 900px)", left: "50%", transform: "translateX(-50%)", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="milk" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
            <stop offset="0" style={{ stopColor: "var(--caffeine-drip)" }} />
            <stop
              offset="1"
              style={{ stopColor: "color-mix(in srgb, var(--caffeine-drip) 84%, #d8b48a)" }}
            />
          </linearGradient>
        </defs>

        <path d={BODY} fill="url(#milk)" />
        {DRIPS.map((d, i) => (
          <DripShape key={i} d={d} still={still} />
        ))}
        {/* Soft sheen following the crest. */}
        <path d={SHEEN} fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
