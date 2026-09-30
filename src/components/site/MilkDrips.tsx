import type { CSSProperties } from "react";

/* Shared, filter-free milk drips (used by the opening loader and by the strip
   under "Our Story").

   Why not the earlier "goo" SVG filter: a blur + threshold filter over the
   whole strip has to be recomputed on every frame in which anything inside it
   moves — with ~40 drips breathing at once that was most of the page's lag.
   Here the soft joins are drawn into the shapes themselves (a flared mouth
   where a drip leaves the band, a swelling neck into the bulb), and the
   motion is plain transforms on two pieces per drip:
     - the stem   (scaleY from its top edge)
     - the bulb   (translateY by exactly the amount the stem grew)
   so nothing is ever re-blurred and no shape is redrawn. */

export const VB_W = 1440;

export type DripKind = "still" | "flow" | "drop";

export type Drip = {
  cx: number;
  a: number; // stem half-width
  L: number; // stem length below the band
  r: number; // bulb radius
  kind: DripKind;
  e: number; // how far it stretches (user units)
  dur: number; // seconds
  begin: number; // negative delay so drips start out of step
  fall: number; // how far a released drop falls
};

export function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}

const f = (n: number) => Math.round(n * 10) / 10;

export type DripOptions = {
  seed: number;
  /** Horizontal gap between drips [min, max]. */
  gap: [number, number];
  /** Seconds for one stretch cycle [min, max]. */
  dur: [number, number];
  /** Share of drips that stay still, and the length that qualifies for a full drop. */
  stillShare: number;
  dropMinL: number;
  dropSpacing: number;
};

export function makeDrips(o: DripOptions): Drip[] {
  const rand = rng(o.seed);
  const out: Drip[] = [];
  let x = 34 + rand() * 24;
  while (x < VB_W - 30) {
    const roll = rand();
    const fat = roll < o.stillShare;
    const thin = !fat && roll > 0.72;
    const a = fat ? 14 + rand() * 6 : thin ? 7 + rand() * 2.5 : 9.5 + rand() * 3.5;
    const L = fat ? 14 + rand() * 16 : thin ? 90 + rand() * 90 : 40 + rand() * 46;
    out.push({
      cx: x,
      a,
      L,
      r: a * (fat ? 1.25 : 1.45) + 4,
      kind: fat ? "still" : "flow",
      e: 14 + rand() * 14,
      dur: o.dur[0] + rand() * (o.dur[1] - o.dur[0]),
      begin: -rand() * 14,
      fall: 130 + rand() * 60,
    });
    x += o.gap[0] + rand() * (o.gap[1] - o.gap[0]);
  }
  let last = -1e9;
  out.forEach((d) => {
    if (d.kind !== "still" && d.L > o.dropMinL && d.cx - last > o.dropSpacing) {
      d.kind = "drop";
      d.e = 26 + rand() * 16;
      last = d.cx;
    }
  });
  return out;
}

/* Wavy band: a closed path from above the top edge down to bandY(x). */
export function bandPath(bandY: (x: number) => number, top = -40, step = 12): string {
  const p = [`M-80 ${top}L${VB_W + 80} ${top}L${VB_W + 80} ${f(bandY(VB_W + 80))}`];
  for (let x = VB_W + 80; x >= -80; x -= step) p.push(`L${x} ${f(bandY(x))}`);
  return p.join("") + "Z";
}

function mouthPath(d: Drip, bandY: (x: number) => number): string {
  const fil = 12 + d.a * 0.7; // fillet size
  const xl = d.cx - d.a - fil;
  const xr = d.cx + d.a + fil;
  const yl = bandY(xl);
  const yr = bandY(xr);
  const y0 = bandY(d.cx);
  const yb = y0 + fil;
  return [
    `M${f(xl)} ${f(yl - 8)}`,
    `L${f(xl)} ${f(yl)}`,
    `Q${f(d.cx - d.a)} ${f(yl)} ${f(d.cx - d.a)} ${f(yb)}`,
    `L${f(d.cx + d.a)} ${f(yb)}`,
    `Q${f(d.cx + d.a)} ${f(yr)} ${f(xr)} ${f(yr)}`,
    `L${f(xr)} ${f(yr - 8)}`,
    "Z",
  ].join("");
}

function bulbPath(d: Drip, yc: number): string {
  const { cx, a, r } = d;
  const top = yc - r * 2.6;
  return [
    `M${f(cx - a)} ${f(top)}`,
    `C${f(cx - a)} ${f(yc - r * 1.05)} ${f(cx - r)} ${f(yc - r * 1.05)} ${f(cx - r)} ${f(yc)}`,
    `A${f(r)} ${f(r)} 0 0 0 ${f(cx + r)} ${f(yc)}`,
    `C${f(cx + r)} ${f(yc - r * 1.05)} ${f(cx + a)} ${f(yc - r * 1.05)} ${f(cx + a)} ${f(top)}`,
    "Z",
  ].join("");
}

/* All drips, as one flat list of shapes. Animation is driven entirely by the
   CSS in globals.css (.md-* classes) and the custom properties set here. */
export function DripField({
  drips,
  bandY,
  mode,
}: {
  drips: Drip[];
  bandY: (x: number) => number;
  mode: "living" | "static";
}) {
  return (
    <>
      {drips.map((d, i) => {
        const y0 = bandY(d.cx);
        const moving = mode === "living" && d.kind !== "still";
        const vars = {
          "--e": `${f(d.e)}px`,
          "--es": f((d.e / (d.L + 6)) * 1000) / 1000,
          "--sb": f((6 / (d.L + 6)) * 1000) / 1000,
          "--L": `${f(d.L)}px`,
          "--sy": 1 + d.e / 40,
          "--dur": `${f(d.dur)}s`,
          "--del": `${f(d.begin)}s`,
          "--fall": `${f(d.fall)}px`,
          "--dd": `${f((((i * 37) % 11) / 24) * 100) / 100}s`,
        } as CSSProperties;
        const cls = moving ? (d.kind === "drop" ? "md-drip md-drop" : "md-drip md-flow") : "md-drip";
        const yc = y0 + d.L;
        return (
          <g key={i} className={cls} style={vars}>
            <path d={mouthPath(d, bandY)} />
            <rect className="md-stem" x={f(d.cx - d.a)} y={f(y0 - 6)} width={f(d.a * 2)} height={f(d.L + 6)} />
            <g className="md-bulb">
              <path d={bulbPath(d, yc)} />
              <ellipse cx={f(d.cx - d.r * 0.38)} cy={f(yc - d.r * 0.2)} rx={f(d.r * 0.2)} ry={f(d.r * 0.34)} fill="#fff" opacity="0.42" />
            </g>
            {moving && d.kind === "drop" && <circle className="md-falling" cx={f(d.cx)} cy={f(yc)} r={f(d.r * 1.05)} />}
          </g>
        );
      })}
    </>
  );
}

