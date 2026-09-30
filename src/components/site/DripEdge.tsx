"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { DripField, bandPath, makeDrips } from "@/components/site/MilkDrips";

/* Milk-drip edge under "Our Story".

   The band and every drip are plain filled shapes (no SVG filters — those
   were re-blurred on every frame and were the main cause of page lag); see
   MilkDrips.tsx for how the drips are drawn and animated with transforms.
   Animation pauses while the strip is off screen and is off entirely for
   prefers-reduced-motion. Colour is var(--caffeine-drip), editable in
   Admin → Look & Feel. Geometry is seeded, so server and browser markup
   match. */

const W = 1440;
const H = 360;
const BAND = 30;

const bandY = (x: number) => BAND + 5 * Math.sin(x / 120 + 1) + 3 * Math.sin(x / 47);
const DRIPS = makeDrips({ seed: 77, gap: [34, 74], dur: [5.2, 8.6], stillShare: 0.24, dropMinL: 80, dropSpacing: 150 });
const BAND_D = bandPath(bandY, -40);

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
    svg.classList.add("md-paused");
    const io = new IntersectionObserver(
      ([entry]) => svg.classList.toggle("md-paused", !entry.isIntersecting),
      { rootMargin: "120px 0px" }
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
        <g style={{ fill: "var(--caffeine-drip)" }}>
          <path d={BAND_D} />
          <DripField drips={DRIPS} bandY={bandY} mode={still ? "static" : "living"} />
        </g>
      </svg>
    </div>
  );
}
