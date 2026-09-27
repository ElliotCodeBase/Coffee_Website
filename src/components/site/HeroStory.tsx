"use client";

import { useEffect, useRef } from "react";
import type { SiteSettings } from "@/types/database";

/* Warm radial-gradient placeholders in the new palette, used only when
   `settings.hero_image_url` / `about_image_url` are unset. Generated inline
   (no external image request) so the hero reads as atmosphere behind the
   cup art rather than competing photo detail — see redesign brief §3. */
const FALLBACK_HERO_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='1200'%3E%3Cdefs%3E%3CradialGradient id='g' cx='58%25' cy='30%25' r='80%25'%3E%3Cstop offset='0%25' stop-color='%23ee8f49'/%3E%3Cstop offset='45%25' stop-color='%23241c15'/%3E%3Cstop offset='100%25' stop-color='%2319140f'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1600' height='1200' fill='url(%23g)'/%3E%3C/svg%3E";
const FALLBACK_STORY_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1600' height='1200'%3E%3Cdefs%3E%3CradialGradient id='g2' cx='30%25' cy='65%25' r='85%25'%3E%3Cstop offset='0%25' stop-color='%23f0b36b'/%3E%3Cstop offset='50%25' stop-color='%23241c15'/%3E%3Cstop offset='100%25' stop-color='%2319140f'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1600' height='1200' fill='url(%23g2)'/%3E%3C/svg%3E";
/* Foreground cup art — a static design asset (see brief §3), not swapped
   by the admin, so it intentionally doesn't reuse hero_image_url's
   settings-driven meaning. */
const CUP_ART = "/coffee-cup-hero.png";

const SCROLL_MULTIPLIER = 2.4;
const EASE_FACTOR = 0.12;

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

export default function HeroStory({ settings }: { settings: SiteSettings | null }) {
  const heroImg = settings?.hero_image_url || FALLBACK_HERO_IMG;
  const storyImg = settings?.about_image_url || FALLBACK_STORY_IMG;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const halfARef = useRef<HTMLDivElement>(null);
  const halfBRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const storyImgRef = useRef<HTMLDivElement>(null);
  const storyOverlayRef = useRef<HTMLDivElement>(null);

  const heroBadgeRef = useRef<HTMLSpanElement>(null);
  const heroHeadingRef = useRef<HTMLHeadingElement>(null);
  const heroBodyRef = useRef<HTMLParagraphElement>(null);
  const heroCueRef = useRef<HTMLDivElement>(null);
  const heroTextBlockRef = useRef<HTMLDivElement>(null);
  const cupRef = useRef<HTMLImageElement>(null);

  const storyBadgeRef = useRef<HTMLSpanElement>(null);
  const storyHeadingRef = useRef<HTMLHeadingElement>(null);
  const storyBodyRef = useRef<HTMLParagraphElement>(null);
  const storyBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function apply(progress: number) {
      const splitP = clamp(progress / 0.55);
      const storyP = clamp((progress - 0.4) / 0.6);

      const shift = splitP * 65;
      const rotate = splitP * 4;
      const fade = 1 - splitP * 0.95;

      if (halfARef.current) {
        halfARef.current.style.transform = `translate(${-shift}%, ${shift}%) rotate(${-rotate}deg)`;
        halfARef.current.style.opacity = String(fade);
      }
      if (halfBRef.current) {
        halfBRef.current.style.transform = `translate(${shift}%, ${-shift}%) rotate(${rotate}deg)`;
        halfBRef.current.style.opacity = String(fade);
      }
      if (overlayRef.current) {
        overlayRef.current.style.opacity = String(1 - splitP * 0.7);
      }
      // Cup art fades and drifts upward out of frame as the split
      // progresses, disappearing into the reveal the same way the hero
      // text does, rather than sitting static while everything else moves.
      if (cupRef.current) {
        cupRef.current.style.opacity = String(1 - splitP);
        cupRef.current.style.transform = `translateY(${-splitP * 60}px) scale(${1 - splitP * 0.08})`;
      }

      const badgeP = clamp(splitP / 0.55);
      const headingP = clamp((splitP - 0.08) / 0.55);
      const bodyP = clamp((splitP - 0.18) / 0.55);
      const cueP = clamp(splitP / 0.35);

      if (heroBadgeRef.current) {
        heroBadgeRef.current.style.transform = `translateX(${-badgeP * 120}px)`;
        heroBadgeRef.current.style.opacity = String(1 - badgeP);
      }
      if (heroHeadingRef.current) {
        heroHeadingRef.current.style.transform = `translateX(${-headingP * 160}px)`;
        heroHeadingRef.current.style.opacity = String(1 - headingP);
      }
      if (heroBodyRef.current) {
        heroBodyRef.current.style.transform = `translateX(${-bodyP * 140}px)`;
        heroBodyRef.current.style.opacity = String(1 - bodyP);
      }
      if (heroCueRef.current) {
        heroCueRef.current.style.opacity = String(1 - cueP);
      }
      if (heroTextBlockRef.current) {
        heroTextBlockRef.current.style.pointerEvents = splitP > 0.5 ? "none" : "auto";
      }

      const sBadgeP = clamp(storyP / 0.55);
      const sHeadingP = clamp((storyP - 0.12) / 0.55);
      const sBodyP = clamp((storyP - 0.24) / 0.55);

      if (storyImgRef.current) {
        storyImgRef.current.style.opacity = String(storyP);
      }
      if (storyOverlayRef.current) {
        storyOverlayRef.current.style.opacity = String(storyP);
      }

      if (storyBadgeRef.current) {
        storyBadgeRef.current.style.transform = `translateY(${(1 - sBadgeP) * 46}px)`;
        storyBadgeRef.current.style.opacity = String(sBadgeP);
      }
      if (storyHeadingRef.current) {
        storyHeadingRef.current.style.transform = `translateY(${(1 - sHeadingP) * 56}px)`;
        storyHeadingRef.current.style.opacity = String(sHeadingP);
      }
      if (storyBodyRef.current) {
        storyBodyRef.current.style.transform = `translateY(${(1 - sBodyP) * 46}px)`;
        storyBodyRef.current.style.opacity = String(sBodyP);
      }
      if (storyBlockRef.current) {
        storyBlockRef.current.style.pointerEvents = storyP > 0.4 ? "auto" : "none";
      }
    }

    function computeProgress(): number {
      const el = wrapperRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      const raw = -rect.top / scrollable;
      return reducedMotion ? (raw > 0.05 ? 1 : 0) : clamp(raw);
    }

    let rafId: number | null = null;
    let smoothed = computeProgress();

    function loop() {
      const target = computeProgress();
      if (reducedMotion) {
        smoothed = target;
      } else {
        smoothed += (target - smoothed) * EASE_FACTOR;
        if (Math.abs(target - smoothed) < 0.0006) smoothed = target;
      }
      apply(smoothed);
      rafId = requestAnimationFrame(loop);
    }

    function startLoop() {
      if (rafId === null) rafId = requestAnimationFrame(loop);
    }
    function stopLoop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    apply(smoothed);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startLoop();
        else stopLoop();
      },
      { rootMargin: "100px 0px" }
    );
    if (wrapperRef.current) observer.observe(wrapperRef.current);

    const resizeObserver = new ResizeObserver(() => {
      smoothed = computeProgress();
      apply(smoothed);
    });
    if (wrapperRef.current) resizeObserver.observe(wrapperRef.current);
    window.addEventListener("load", () => {
      smoothed = computeProgress();
      apply(smoothed);
    });

    return () => {
      stopLoop();
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      id="hero-header"
      className="relative"
      style={{ height: `${SCROLL_MULTIPLIER * 100}vh` }}
    >
      <span id="about" className="absolute left-0 w-px h-px" style={{ top: "42%" }} aria-hidden="true" />

      <div className="sticky top-0 h-screen w-full overflow-hidden bg-caffeine-dark">
        {/* Story background image */}
        <div ref={storyImgRef} className="absolute inset-0 will-change-[opacity]" style={{ opacity: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={storyImg}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div
          ref={storyOverlayRef}
          className="absolute inset-0 bg-gradient-to-t from-caffeine-dark/95 via-caffeine-dark/70 to-caffeine-dark/40 will-change-[opacity]"
          style={{ opacity: 0 }}
        />

        {/* Diagonal image halves */}
        <div
          ref={halfARef}
          className="absolute inset-0 will-change-transform"
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImg}
            alt="Cozy coffee shop interior"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            loading="eager"
          />
        </div>
        <div
          ref={halfBRef}
          className="absolute inset-0 will-change-transform"
          style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImg}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            loading="eager"
          />
        </div>

        <div
          ref={overlayRef}
          className="absolute inset-0 bg-gradient-to-r from-caffeine-dark/95 via-caffeine-dark/70 to-caffeine-dark/30 will-change-[opacity]"
        />

        {/* Hero text — mobile-first sizing */}
        <div
          ref={heroTextBlockRef}
          className="absolute inset-0 flex items-center px-5 sm:px-10 lg:px-20 xl:px-32 pt-14 sm:pt-18 lg:pt-22"
        >
          <div className="relative z-10 w-full grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] items-center gap-2 lg:gap-10">
            {/* Cup art — its own layer, faded/lifted out via splitP above.
                pointer-events-none so it never intercepts clicks even while
                heroTextBlockRef itself is still interactive. */}
            <div className="order-first lg:order-last flex justify-center lg:justify-end pointer-events-none select-none">
              <div className="relative w-40 xs:w-48 sm:w-64 lg:w-full lg:max-w-md">
                <div
                  aria-hidden="true"
                  className="blob absolute -inset-6 sm:-inset-10 bg-caffeine-accent/30 blur-2xl"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={cupRef}
                  src={CUP_ART}
                  alt=""
                  aria-hidden="true"
                  className="relative w-full h-auto drop-shadow-2xl will-change-transform"
                  loading="eager"
                />
              </div>
            </div>

            <div className="max-w-xl sm:max-w-2xl lg:max-w-none space-y-3 sm:space-y-5">
              <span
                ref={heroBadgeRef}
                className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] lg:text-xs uppercase font-bold tracking-widest text-stone-100 bg-white/10 border border-white/20 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full backdrop-blur-sm will-change-transform"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-caffeine-gold" aria-hidden="true" />
                Open Daily
              </span>
              <h1
                ref={heroHeadingRef}
                className="font-cozy text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.05] will-change-transform"
              >
                {settings?.hero_headline || "Good coffee, good people."}
              </h1>
              <p
                ref={heroBodyRef}
                className="text-stone-300 text-xs sm:text-sm lg:text-base xl:text-lg font-normal leading-relaxed max-w-md sm:max-w-xl will-change-transform"
              >
                {settings?.hero_subtext ||
                  "We keep things simple: carefully roasted beans, house-made syrups, and a warm neighborhood spot to sit back and catch your breath."}
              </p>

              <div
                ref={heroCueRef}
                className="pt-2 sm:pt-4 flex items-center gap-2 text-xs sm:text-sm lg:text-base font-bold text-stone-200"
              >
                <span>Scroll to read our story</span>
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Story text — mobile-first sizing */}
        <div
          ref={storyBlockRef}
          className="absolute inset-0 flex items-center px-5 sm:px-10 lg:px-20 xl:px-32"
        >
          <div className="relative z-20 w-full max-w-screen-2xl mx-auto">
            <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl space-y-4 sm:space-y-6">
              <span
                ref={storyBadgeRef}
                className="inline-flex items-center gap-1.5 text-[9px] sm:text-xs uppercase font-bold tracking-widest text-stone-100 bg-white/10 border border-white/20 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full backdrop-blur-sm will-change-transform"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-caffeine-gold" aria-hidden="true" />
                Our Roots
              </span>
              <h2
                ref={storyHeadingRef}
                className="font-cozy text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white will-change-transform"
              >
                {settings?.about_headline || "Built around the neighborhood."}
              </h2>
              <p
                ref={storyBodyRef}
                className="text-stone-300 text-xs sm:text-sm lg:text-base xl:text-lg leading-relaxed font-normal will-change-transform"
              >
                {settings?.about_body ||
                  "We started with a simple idea: create a room where locals could slow down, put their phones away for a minute, and actually taste their coffee. What began as a handful of tables and a secondhand espresso machine has grown into a daily stop for the neighborhood — but the idea hasn't changed. We source beans in small batches, roast them ourselves, and pull every shot the same careful way whether it's your first visit or your five-hundredth. Come for the coffee, stay for the people who've made this place feel like home."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
