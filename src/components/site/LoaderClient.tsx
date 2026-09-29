"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { LoaderConfig } from "@/lib/loader-config";

/* Opening loading animation.

   1. Milk pours down from the top of the screen as the percentage counts,
      its lower edge a live fringe of drips that swell, stretch and let go of
      drops (the number is drawn twice — light on the dark background, dark
      on top of the milk — so it stays readable as the milk passes through).
   2. At 100% the whole screen is milk. It then falls away down the screen,
      dragging stringy tails behind it, and the site is uncovered from the
      top.

   The percentage is honest: it follows a smooth curve for the chosen
   length, but is held at 94% until the page has really finished loading
   (window "load" + web fonts), so it never says 100% while things are still
   arriving. Options come from Admin → Theme & Colors → Loading animation.
   prefers-reduced-motion gets a short fade instead of waves and drips. */

const SEEN_KEY = "sl-seen";
/* Drip fringe: deterministic so server and browser markup match. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a * 1664525 + 1013904223) % 4294967296;
    return a / 4294967296;
  };
}
type FringeDrip = { cx: number; w: number; L: number; r: number; sy: number; dd: number; bd: number; be: number; fd: number };
const FRINGE: FringeDrip[] = (() => {
  const rand = rng(41);
  const out: FringeDrip[] = [];
  let x = 24 + rand() * 20;
  while (x < 1440 - 20) {
    const roll = rand();
    const w = roll < 0.3 ? 24 + rand() * 12 : roll < 0.8 ? 15 + rand() * 7 : 12 + rand() * 4;
    const L = roll < 0.3 ? 16 + rand() * 18 : roll < 0.8 ? 46 + rand() * 50 : 120 + rand() * 80;
    out.push({
      cx: x,
      w,
      L,
      r: w * 0.7 + 3,
      sy: 1.5 + rand() * 1.4,
      dd: rand() * 0.45,
      bd: 3.2 + rand() * 3.4,
      be: roll < 0.3 ? 1.12 : 1.18 + rand() * 0.22,
      fd: -rand() * 6,
    });
    x += 46 + rand() * 70;
  }
  return out;
})();
const bandY = (x: number) => 24 + 4 * Math.sin(x / 110) + 3 * Math.sin(x / 41);
const BAND = (() => {
  const p = [`M-80 -10L1520 -10L1520 ${bandY(1520).toFixed(1)}`];
  for (let x = 1520; x >= -80; x -= 12) p.push(`L${x} ${bandY(x).toFixed(1)}`);
  return p.join("") + "Z";
})();

function Fringe({ id, className, living = false }: { id: string; className: string; living?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 1440 300" aria-hidden="true">
      <defs>
        <filter id={id} filterUnits="userSpaceOnUse" x="-80" y="-20" width="1600" height="440" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="b" />
          <feColorMatrix in="b" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -12" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} style={{ fill: "var(--caffeine-drip)" }}>
        <path d={BAND} />
        {FRINGE.map((d, i) => (
          <g key={i} className="sl-drip" style={{ "--sy": d.sy, "--dd": `${d.dd.toFixed(2)}s` } as CSSProperties}>
            <g
              className={living ? "sl-drip-in" : undefined}
              style={{ "--bd": `${d.bd.toFixed(1)}s`, "--be": d.be.toFixed(2), "--bdel": `${d.fd.toFixed(1)}s` } as CSSProperties}
            >
              <rect x={d.cx - d.w / 2} y={12} width={d.w} height={d.L + 10} />
              <circle cx={d.cx} cy={22 + d.L} r={d.r} />
            </g>
            {living && d.L > 100 && (
              <circle
                className="sl-fall"
                cx={d.cx}
                cy={22 + d.L}
                r={d.r * 0.85}
                style={{ "--fdel": `${(d.fd - d.cx / 300).toFixed(1)}s` } as CSSProperties}
              />
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}

function Face({ tone, config, pct }: { tone: "dark" | "milk"; config: LoaderConfig; pct: number }) {
  const onMilk = tone === "milk";
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      {config.label && (
        <p
          className={`mb-3 max-w-full truncate text-xs sm:text-sm font-bold uppercase tracking-[0.34em] ${
            onMilk ? "text-caffeine-dark/70" : "text-caffeine-gold"
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

  useEffect(() => {
    const root = rootRef.current;
    if (!config.enabled) return;
    if (!preview && config.frequency === "session") {
      try {
        if (sessionStorage.getItem(SEEN_KEY)) {
          // Already shown this session: just keep it out of sight.
          if (root) root.style.display = "none";
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

    let loaded = preview || document.readyState === "complete";
    let fontsReady = preview || typeof document.fonts === "undefined";
    const isReady = () => loaded && fontsReady;
    const onLoad = () => {
      loaded = true;
    };
    if (!loaded) window.addEventListener("load", onLoad);
    if (!fontsReady) {
      document.fonts.ready.then(
        () => (fontsReady = true),
        () => (fontsReady = true)
      );
    }
    // Never hold the visitor hostage to a slow third-party asset.
    const hardCap = window.setTimeout(() => {
      loaded = true;
      fontsReady = true;
    }, Math.max(D + 3500, 7000));

    const timers: number[] = [];
    let raf = 0;
    let last = -1;
    const t0 = performance.now();

    const finish = () => {
      html.classList.remove("sl-lock");
      setPhase("drain");
      timers.push(window.setTimeout(() => setPhase("gone"), reduced ? 450 : 1700));
    };

    const tick = (now: number) => {
      const x = Math.min(1, (now - t0) / D);
      let p = 1 - Math.pow(1 - x, 2.2);
      if (!isReady()) p = Math.min(p, 0.94);
      rootRef.current?.style.setProperty("--p", p.toFixed(4));
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
      window.removeEventListener("load", onLoad);
      html.classList.remove("sl-lock");
    };
  }, [config.enabled, config.durationMs, config.frequency, preview]);

  if (phase === "gone" || !config.enabled) return null;

  return (
    <div
      ref={rootRef}
      className={`site-loader ${preview ? "site-loader--preview" : ""}`}
      data-phase={phase}
      style={{ "--p": 0 } as CSSProperties}
      aria-hidden={phase === "drain" ? true : undefined}
    >
      <p className="sr-only" role="status">
        Loading
      </p>
      <div className="sl-mover">
        <div className="sl-dark">
          <Face tone="dark" config={config} pct={pct} />
        </div>

        <div className="sl-milk">
          <div className="sl-milk-body">
            <div className="sl-milk-inner">
              <Face tone="milk" config={config} pct={pct} />
            </div>
          </div>
          <Fringe id="sl-goo-a" className="sl-fringe sl-fringe--bottom" living />
        </div>

        {/* The same fringe, flipped, hangs off the TOP of the sheet. It is
            off screen while the milk pours; once the sheet falls it trails
            behind as stretching tails. */}
        <Fringe id="sl-goo-b" className="sl-fringe sl-fringe--top" />
      </div>
    </div>
  );
}
