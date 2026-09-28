/* Milk-drip edge under "Our Story" — an ordinary block between the story
   panel and the Menu (not an overlay), so its height is always real and it
   can never be clipped by a parent or covered by the section after it.

   Deliberately dramatic: thick band, long uneven drips, a glossy highlight,
   and a handful of "alive" drips that stretch, squash, pinch off a fat
   drop, and fall — like the panel above is genuinely dripping onto the
   menu. Drip geometry comes from a seeded pseudo-random sequence
   (deterministic, so server and browser render identically — Math.random()
   would cause a hydration mismatch). Color is var(--caffeine-drip), so the
   client can recolor it in Admin → Theme. */

const W = 1440;
const H = 300;
const BAND = 34; // solid milk band above the drips
const FILLET = 16; // rounded shoulder where a drip meets the band
const SLOT = 74;

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

type Drip = { cx: number; w: number; len: number };

function makeDrips(): Drip[] {
  const rand = rng(11);
  const out: Drip[] = [];
  const slots = Math.floor(W / SLOT);
  for (let i = 0; i < slots; i++) {
    // ~1 in 9 slots left bare so the rhythm never reads as a repeat
    if (rand() < 0.11) continue;
    const w = 20 + rand() * 24; // 20–44
    const cx = SLOT / 2 + i * SLOT + (rand() - 0.5) * 22;
    // wide, skewed spread: mostly short-to-medium, several long runners
    const len = Math.max(w / 2 + FILLET + 12, 28 + Math.pow(rand(), 1.5) * 178);
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

/* The longest drips come alive: stem stretches well past its resting tip,
   squashing as it goes, a fat drop pinches off and falls, the stem eases
   back. Spread across the width and given independent, slow, staggered
   timing so they never move in step. */
const LIVING = (() => {
  const rand = rng(53);
  const candidates = DRIPS.map((d) => d).filter((d) => d.len >= 60);
  const picks: Drip[] = [];
  for (const c of candidates) {
    if (picks.length >= 7) break;
    if (picks.every((p) => Math.abs(p.cx - c.cx) > 170)) picks.push(c);
  }
  return picks.map((d, n) => ({
    ...d,
    extra: 34 + rand() * 54, // how much further the stem reaches — exaggerated
    duration: 11 + rand() * 7, // 11–18s: slow, syrupy
    delay: -(n * 2.1 + rand() * 3),
  }));
})();

export default function DripEdge() {
  return (
    <div aria-hidden="true" className="relative block bg-caffeine-dark leading-[0]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full h-auto"
        style={{ filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.35))" }}
      >
        <path d={PATH} style={{ fill: "var(--caffeine-drip)" }} />
        {/* Glossy highlight along the top of the band. */}
        <rect x="0" y="0" width={W} height={BAND * 0.55} fill="#fff" opacity="0.22" />

        {LIVING.map(({ cx, w, len, extra, duration, delay }, i) => {
          const stemW = w * 0.6;
          const stemH = len + extra;
          const tipY = BAND + stemH;
          const dropR = stemW * 0.62;
          return (
            <g key={i} style={{ fill: "var(--caffeine-drip)" }}>
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
                cy={tipY - stemW * 0.25}
                r={dropR}
                style={{ animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
