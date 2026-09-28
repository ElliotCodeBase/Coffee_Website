"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/* Milk-drip edge under "Our Story" — rebuilt as real, gooey liquid.

   Everything that is milk (the band, every stem, every bulb and every falling
   drop) is drawn as simple shapes inside ONE group that goes through an SVG
   "goo" filter (blur + alpha threshold). That is what makes it look like
   liquid rather than cartoon icons:
   - stems flow into the band with soft, natural fillets,
   - a bulb swells at the end of each stem as it stretches,
   - when a drop leaves, the neck between it and the stem thins out and then
     snaps on its own — nothing is hand-drawn for the pinch.
   Motion is SMIL so a stem and its falling drop share one clock. It pauses
   off screen and is off for prefers-reduced-motion.

   Geometry is seeded (deterministic) so server and browser render the same
   markup. Colour is var(--caffeine-drip), editable in Admin → Theme. */

const W = 1440;
const H = 360;
const BAND = 30; // milk band height (flush with the panel above)
const OUT = 80; // band runs this far past each side so the goo rounding never shows

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

const f = (n: number) => Math.round(n * 10) / 10;
// Gentle swell along the underside of the band.
const under = (x: number) => BAND + 5 * Math.sin(x / 120 + 1) + 3 * Math.sin(x / 47);

type Kind = "drop" | "flow" | "still";
type Drip = {
  cx: number;
  w: number; // stem width
  L: number; // resting length below the band
  r: number; // bulb radius
  kind: Kind;
  e: number; // stretch
  dur: number;
  begin: number;
  fall: number;
};

function makeDrips(): Drip[] {
  const rand = rng(77);
  const out: Drip[] = [];
  let x = 40 + rand() * 30;
  while (x < W - 30) {
    const roll = rand();
    // Three families so the edge never reads as a repeat: fat short blobs,
    // medium drips, and a few long thin runners.
    const family = roll < 0.3 ? 0 : roll < 0.8 ? 1 : 2;
    const w = family === 0 ? 26 + rand() * 12 : family === 1 ? 16 + rand() * 7 : 13 + rand() * 4;
    const L = family === 0 ? 14 + rand() * 16 : family === 1 ? 44 + rand() * 46 : 110 + rand() * 70;
    const r = w * (family === 0 ? 0.6 : 0.72) + 3;
    out.push({
      cx: x,
      w,
      L,
      r,
      kind: family === 0 ? "still" : "flow",
      e: 12 + rand() * 12,
      dur: 9 + rand() * 6,
      begin: -rand() * 14,
      fall: 130 + rand() * 60,
    });
    x += 44 + rand() * 78;
  }
  // The long runners, spread across the width, get the full stretch → pinch → fall.
  let last = -1e9;
  out.forEach((d) => {
    if (d.L > 105 && d.cx - last > 260) {
      d.kind = "drop";
      d.e = 26 + rand() * 16;
      d.dur = 12 + rand() * 6;
      last = d.cx;
    }
  });
  return out;
}

const DRIPS = makeDrips();

const BAND_PATH = (() => {
  const p = [`M${-OUT} -40L${W + OUT} -40L${W + OUT} ${f(under(W + OUT))}`];
  for (let x = W + OUT; x >= -OUT; x -= 12) p.push(`L${x} ${f(under(x))}`);
  p.push("Z");
  return p.join("");
})();

const NO = "0 0 1 1";
const EASE = "0.45 0 0.55 1";

function Drip({ d, still }: { d: Drip; still: boolean }) {
  const y0 = under(d.cx);
  const top = y0 - 12; // stem starts inside the band
  const stemH = (L: number) => f(L + 12 - d.r * 0.2);
  const bulbY = (L: number) => f(y0 + L);
  const animated = !still && d.kind !== "still";
  const timing = { dur: `${f(d.dur)}s`, begin: `${f(d.begin)}s`, repeatCount: "indefinite" } as const;

  if (!animated) {
    return (
      <g>
        <rect x={f(d.cx - d.w / 2)} y={f(top)} width={f(d.w)} height={stemH(d.L)} />
        <circle cx={f(d.cx)} cy={bulbY(d.L)} r={f(d.r)} />
      </g>
    );
  }

  if (d.kind === "flow") {
    const { L, e, r } = d;
    const kt = "0;0.5;1";
    const sp = `${EASE};${EASE}`;
    return (
      <g>
        <rect x={f(d.cx - d.w / 2)} y={f(top)} width={f(d.w)} height={stemH(L)}>
          <animate attributeName="height" values={`${stemH(L)};${stemH(L + e)};${stemH(L)}`} keyTimes={kt} calcMode="spline" keySplines={sp} {...timing} />
        </rect>
        <circle cx={f(d.cx)} cy={bulbY(L)} r={f(r)}>
          <animate attributeName="cy" values={`${bulbY(L)};${bulbY(L + e)};${bulbY(L)}`} keyTimes={kt} calcMode="spline" keySplines={sp} {...timing} />
          <animate attributeName="r" values={`${f(r)};${f(r * 1.12)};${f(r)}`} keyTimes={kt} calcMode="spline" keySplines={sp} {...timing} />
        </circle>
      </g>
    );
  }

  // kind === "drop": slow swell, long stretch, the drop lets go, the stem snaps back.
  const { L, e, r } = d;
  const Lmax = L + e;
  const kt = "0;0.28;0.62;0.7;0.82;1";
  const sp = [EASE, EASE, "0.2 0.9 0.3 1", EASE, EASE].join(";");
  const stemVals = [L, L + e * 0.4, Lmax, L - 6, L + 3, L].map(stemH).join(";");
  const bulbVals = [L, L + e * 0.4, Lmax, L - 6, L + 3, L].map(bulbY).join(";");
  const rVals = [r, r * 1.1, r * 1.3, r * 0.85, r * 1.0, r].map(f).join(";");
  const dropR = f(r * 1.25);
  const startY = bulbY(Lmax);
  // The drop is created at the bulb's position at t=0.62, sits for a breath,
  // then falls with gravity and shrinks to nothing as it lands.
  const fallSp = `${NO};0.35 0 0.6 1;0.5 0 0.9 0.5;${NO}`;
  return (
    <g>
      <rect x={f(d.cx - d.w / 2)} y={f(top)} width={f(d.w)} height={stemH(L)}>
        <animate attributeName="height" values={stemVals} keyTimes={kt} calcMode="spline" keySplines={sp} {...timing} />
      </rect>
      <circle cx={f(d.cx)} cy={bulbY(L)} r={f(r)}>
        <animate attributeName="cy" values={bulbVals} keyTimes={kt} calcMode="spline" keySplines={sp} {...timing} />
        <animate attributeName="r" values={rVals} keyTimes={kt} calcMode="spline" keySplines={sp} {...timing} />
      </circle>
      <circle cx={f(d.cx)} cy={startY} r="0">
        <animate attributeName="r" values={`0;0;${dropR};${dropR};${f(dropR * 0.9)};0;0`} keyTimes="0;0.6;0.63;0.7;0.9;0.97;1" calcMode="linear" {...timing} />
        <animate
          attributeName="cy"
          values={`${startY};${startY};${f(startY + 5)};${f(startY + d.fall)};${f(startY + d.fall)}`}
          keyTimes="0;0.62;0.72;0.96;1"
          calcMode="spline"
          keySplines={fallSp}
          {...timing}
        />
      </circle>
    </g>
  );
}

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
    <div aria-hidden="true" className="pointer-events-none relative z-10 block overflow-x-clip bg-caffeine-dark leading-[0]" style={{ marginTop: -1 }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="relative block h-auto max-w-none"
        style={{ width: "max(100%, 900px)", left: "50%", transform: "translateX(-50%)", overflow: "visible" }}
      >
        <defs>
          <filter id="milk-goo" filterUnits="userSpaceOnUse" x={-OUT} y="-50" width={W + OUT * 2} height={H + 50} colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="b" />
            <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -12" />
          </filter>
          <linearGradient id="milk-fill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="230">
            <stop offset="0" style={{ stopColor: "var(--caffeine-drip)" }} />
            <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--caffeine-drip) 86%, #d9b891)" }} />
          </linearGradient>
        </defs>

        <g style={{ filter: "drop-shadow(0 12px 12px rgba(0,0,0,0.35))" }}>
          <g filter="url(#milk-goo)" fill="url(#milk-fill)">
            <path d={BAND_PATH} />
            {DRIPS.map((d, i) => (
              <Drip key={i} d={d} still={still} />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
