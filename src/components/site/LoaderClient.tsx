"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { LoaderConfig } from "@/lib/loader-config";
import { DripField, bandPath, makeDrips } from "@/components/site/MilkDrips";

/* Opening loading animation.

   1. Milk pours down from the top of the screen as the percentage counts,
      its lower edge a fringe of drips that swell, stretch and let go of drops
      (the number is drawn twice — light on the dark background, dark on top
      of the milk — so it stays readable as the milk passes through).
   2. At 100% the whole screen is milk. It then falls away down the screen,
      dragging stringy tails behind it, and the site is uncovered from the
      top.

   Performance: the milk is moved by writing a transform once per frame
   (no CSS-variable cascade, no filters), the drips are plain shapes animated
   with transforms (see MilkDrips.tsx), and the fringe is memoized so the
   percentage ticking up never re-renders it.

   The percentage is honest: it follows a smooth curve for the chosen length,
   but is held at 94% until fonts and the hero picture are really ready, so it
   never says 100% while things are still arriving. It deliberately does NOT
   wait for the browser's full "load" event — that also waits for every
   below-the-fold asset and could hold the loader for seconds. Options come
   from Admin → Look & Feel → Loading animation. prefers-reduced-motion gets a
   short fade instead of waves and drips. */

const SEEN_KEY = "sl-seen";
const FRINGE_RATIO = 300 / 1440;

const bandY = (x: number) => 24 + 4 * Math.sin(x / 110) + 3 * Math.sin(x / 41);
const DRIPS = makeDrips({ seed: 41, gap: [34, 72], dur: [2.0, 4.2], stillShare: 0.24, dropMinL: 62, dropSpacing: 90 });
const BAND = bandPath(bandY, -10);

const Fringe = memo(function Fringe({ className, living }: { className: string; living: boolean }) {
  return (
    <svg className={className} viewBox="0 0 1440 300" aria-hidden="true">
      <g style={{ fill: "var(--caffeine-drip)" }}>
        <path d={BAND} />
        <DripField drips={DRIPS} bandY={bandY} mode={living ? "living" : "static"} />
      </g>
    </svg>
  );
});

function Face({ tone, config, pct }: { tone: "dark" | "milk"; config: LoaderConfig; pct: number }) {
  const onMilk = tone === "milk";
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      {config.label && (
        <p
          className={`mb-3 max-w-full truncate text-xs sm:text-sm font-bold uppercase tracking-[0.34em] ${
            onMilk ? "text-caffeine-dark/70" : "text-white/80"
          }`}
        >
          {config.label}
        </p>
      )}
      {config.showPercent && (
        <p
          className={`font-cozy font-bold leading-none tabular-nums ${onMilk ? "text-caffeine-dark" : "text-caffeine-drip"}`}
          style={{ fontSize: "clamp(3.5rem, 22cqw, 12rem)" }}
        >
          {pct}
          <span className="ml-[0.06em] text-[0.42em] align-top opacity-70">%</span>
        </p>
      )}
    </div>
  );
}

export default function LoaderClient({ config, preview = false }: { config: LoaderConfig; preview?: boolean }) {
  const [phase, setPhase] = useState<"loading" | "drain" | "gone">("loading");
  const [pct, setPct] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const milkRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const milk = milkRef.current;
    const inner = innerRef.current;
    if (!config.enabled || !root || !milk || !inner) return;

    if (!preview && config.frequency === "session") {
      try {
        if (sessionStorage.getItem(SEEN_KEY)) {
          // Already shown this session: just keep it out of sight.
          root.style.display = "none";
          return;
        }
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* storage blocked: just show it */
      }
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const D = reduced ? Math.min(config.durationMs, 900) : config.durationMs;
    const html = document.documentElement;
    if (!preview) html.classList.add("sl-lock");

    /* Geometry is measured once (and on resize), never per frame. */
    let H = 0;
    let FH = 0;
    const measure = () => {
      H = root.clientHeight;
      FH = Math.max(root.clientWidth, 560) * FRINGE_RATIO;
    };
    measure();
    window.addEventListener("resize", measure);
    const place = (p: number) => {
      const off = (1 - p) * (H + FH);
      milk.style.transform = `translate3d(0,${-off}px,0)`;
      inner.style.transform = `translate3d(0,${off}px,0)`;
    };
    place(0);

    /* Ready = fonts are in and the hero picture has arrived. */
    let fontsReady = preview || typeof document.fonts === "undefined";
    if (!fontsReady) {
      document.fonts.ready.then(
        () => (fontsReady = true),
        () => (fontsReady = true)
      );
    }
    const heroImg = preview ? null : document.querySelector<HTMLImageElement>("#hero-header img");
    let imgReady = !heroImg || (heroImg.complete && heroImg.naturalWidth > 0);
    const onImg = () => {
      imgReady = true;
    };
    if (!imgReady && heroImg) {
      heroImg.addEventListener("load", onImg, { once: true });
      heroImg.addEventListener("error", onImg, { once: true });
    }
    // Never hold the visitor hostage to a slow asset.
    const hardCap = window.setTimeout(() => {
      fontsReady = true;
      imgReady = true;
    }, Math.max(D + 1500, 4500));

    const timers: number[] = [];
    let raf = 0;
    let last = -1;
    const t0 = performance.now();

    const finish = () => {
      html.classList.remove("sl-lock");
      setPhase("drain");
      timers.push(window.setTimeout(() => setPhase("gone"), reduced ? 450 : 1500));
    };

    const tick = (now: number) => {
      const x = Math.min(1, (now - t0) / D);
      let p = 1 - Math.pow(1 - x, 2.2);
      if (!(fontsReady && imgReady)) p = Math.min(p, 0.94);
      place(p);
      const shown = p >= 1 ? 100 : Math.min(99, Math.floor(p * 100));
      if (shown !== last) {
        last = shown;
        setPct(shown);
      }
      if (p >= 1) {
        timers.push(window.setTimeout(finish, reduced ? 80 : 420));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hardCap);
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", measure);
      heroImg?.removeEventListener("load", onImg);
      heroImg?.removeEventListener("error", onImg);
      html.classList.remove("sl-lock");
    };
  }, [config.enabled, config.durationMs, config.frequency, preview]);

  if (phase === "gone" || !config.enabled) return null;

  return (
    <div
      ref={rootRef}
      className={`site-loader ${preview ? "site-loader--preview" : ""}`}
      data-phase={phase}
      aria-hidden={phase === "drain" ? true : undefined}
    >
      <p className="sr-only" role="status">
        Loading
      </p>
      <div className="sl-mover">
        <div className="sl-dark">
          <Face tone="dark" config={config} pct={pct} />
        </div>

        <div ref={milkRef} className="sl-milk">
          <div className="sl-milk-body">
            <div ref={innerRef} className="sl-milk-inner">
              <Face tone="milk" config={config} pct={pct} />
            </div>
          </div>
          <Fringe className="sl-fringe sl-fringe--bottom" living />
        </div>

        {/* The same fringe, flipped, hangs off the TOP of the sheet: off
            screen while the milk pours, then trailing tails as it falls. */}
        <Fringe className="sl-fringe sl-fringe--top" living={false} />
      </div>
    </div>
  );
}
