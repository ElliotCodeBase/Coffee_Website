/* Milk-drip edge under "Our Story".

   This is an in-flow block that sits at the bottom of the pinned story
   panel (see HeroStory.tsx), NOT an overlay hanging off it. That is what
   fixes the old cut-off: nothing here overflows its parent, so nothing can
   be clipped by the viewport, the next section, or an overflow rule.

   - The band + drips are one SVG filled with var(--caffeine-drip), the same
     color the story panel uses, so the panel melts straight into it. The
     client recolors it in Admin → Theme.
   - Drip positions, widths and lengths come from a seeded pseudo-random
     sequence (deterministic, so server and browser render identically —
     Math.random() would cause a hydration mismatch). Lengths are spread
     over a wide range with a few gaps, so the edge never reads as a
     repeating pattern.
   - A few drips are "alive": a narrower stem slowly stretches past the
     resting tip, a droplet pinches off and falls, the stem eases back.
     Transform + opacity only (see .drip-* in globals.css). */

const W = 1440;
const H = 216;
const BAND = 22; // solid milk above the drips
const FILLET = 12; // rounded shoulder where a drip meets the band
const SLOT = 80;

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

type Drip = { cx: number; w: number; len: number };

function makeDrips(): Drip[] {
  const rand = rng(7);
  const out: Drip[] = [];
  const slots = Math.floor(W / SLOT);
  for (let i = 0; i < slots; i++) {
    // ~1 in 8 slots is left bare so the rhythm breaks up
    if (rand() < 0.12) continue;
    const w = 18 + rand() * 18; // 18–36
    const cx = SLOT / 2 + i * SLOT + (rand() - 0.5) * 20;
    // skewed toward short with the occasional long runner: 24 → 126
    const len = Math.max(w / 2 + FILLET + 10, 24 + Math.pow(rand(), 1.7) * 102);
    out.push({ cx, w, len });
  }
  return out;
}

const DRIPS = makeDrips();

function buildPath(drips: Drip[]): string {
  const parts = [`M0 0H${W}V${BAND}`];
  [...drips]
    .sort((a, b) => b.cx - a.cx)
    .forEach(({ cx, w, len }) => {
      const r = w / 2;
      const right = cx + r;
      const left = cx - r;
      const tipY = BAND + len - r;
      parts.push(
        `L${right + FILLET} ${BAND}`,
        `Q${right} ${BAND} ${right} ${BAND + FILLET}`,
        `L${right} ${tipY}`,
        `A${r} ${r} 0 0 1 ${left} ${tipY}`,
        `L${left} ${BAND + FILLET}`,
        `Q${left} ${BAND} ${left - FILLET} ${BAND}`
      );
    });
  parts.push(`L0 ${BAND}Z`);
  return parts.join("");
}

const PATH = buildPath(DRIPS);

/* The four longest-enough drips, spread out, come alive. */
const LIVING = (() => {
  const rand = rng(31);
  const candidates = DRIPS.map((d, i) => ({ d, i })).filter(({ d }) => d.len >= 64);
  const picks: typeof candidates = [];
  for (const c of candidates) {
    if (picks.length >= 4) break;
    if (picks.every((p) => Math.abs(p.d.cx - c.d.cx) > 260)) picks.push(c);
  }
  return picks.map(({ d }, n) => ({
    ...d,
    extra: 18 + rand() * 12,
    duration: 8 + rand() * 5,
    delay: -(n * 2.7 + rand() * 2),
  }));
})();

export default function DripEdge() {
  return (
    // block-level, ordinary flow: height comes from the SVG's own intrinsic
    // aspect ratio (viewBox), so this can never be clipped by a parent's
    // fixed height or by the section that follows it.
    <div aria-hidden="true" className="relative block bg-caffeine-dark leading-[0]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full h-auto"
        style={{ fill: "var(--caffeine-drip)" }}
      >
        <path d={PATH} />
        {LIVING.map(({ cx, w, len, extra, duration, delay }, i) => {
          const stemW = w * 0.62;
          const stemH = len + extra;
          const tipY = BAND + stemH;
          return (
            <g key={i}>
              <rect
                className="drip-stem"
                x={cx - stemW / 2}
                y={BAND - 4}
                width={stemW}
                height={stemH + 4}
                rx={stemW / 2}
                style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
              />
              <circle
                className="drip-drop"
                cx={cx}
                cy={tipY - stemW * 0.2}
                r={stemW * 0.5}
                style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
