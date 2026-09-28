/* Milk-drip edge that closes the "Our Story" panel and hangs into the
   section below it.

   The fill is var(--caffeine-drip) (Admin → Theme → "Milk drip under Our
   Story"), so the client can recolor it without a deploy.

   Geometry is authored, not traced: a solid band with rounded, filleted
   drips hanging from it. Three of the drips are "living": a narrower
   stem slowly lengthens past the resting tip, a droplet pinches off,
   falls, and fades, then the stem eases back. Everything animates with
   transform + opacity only (see .drip-* in globals.css), and it sits in
   its own layer so it never touches the hero's scroll-driven transforms. */

const W = 1440;
const BAND = 56; // px of solid milk above the drips (viewBox units)
const H = 236;
const FILLET = 16;

// [center x, width, length below the band]
const DRIPS: [number, number, number][] = [
  [70, 26, 50],
  [190, 34, 110],
  [300, 22, 38],
  [430, 30, 84],
  [560, 40, 140],
  [690, 24, 60],
  [800, 32, 100],
  [930, 26, 44],
  [1050, 38, 128],
  [1180, 24, 70],
  [1310, 30, 96],
  [1400, 20, 40],
];

function buildPath(): string {
  const parts = [`M0 0H${W}V${BAND}`];
  [...DRIPS]
    .sort((a, b) => b[0] - a[0])
    .forEach(([cx, w, len]) => {
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

const PATH = buildPath();

// Which drips are alive, and how far past their resting tip they reach.
const LIVING: { i: number; delay: number; extra: number }[] = [
  { i: 4, delay: 0, extra: 36 },
  { i: 8, delay: -3.2, extra: 30 },
  { i: 1, delay: -6, extra: 34 },
];

export default function DripEdge() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-0 overflow-x-clip"
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute left-1/2 top-0 h-auto w-[max(100%,1000px)] max-w-none"
        style={{ transform: `translate(-50%, -${((BAND / H) * 100).toFixed(2)}%)`, fill: "var(--caffeine-drip)" }}
      >
        <path d={PATH} />
        {LIVING.map(({ i, delay, extra }) => {
          const [cx, w, len] = DRIPS[i];
          const stemW = w * 0.64;
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
                style={{ animationDelay: `${delay}s` }}
              />
              <circle
                className="drip-drop"
                cx={cx}
                cy={tipY - stemW * 0.3}
                r={stemW * 0.52}
                style={{ animationDelay: `${delay}s` }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
