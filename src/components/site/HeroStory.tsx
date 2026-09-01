"use client";

import { useEffect, useRef } from "react";
import type { SiteSettings, MenuItem } from "@/types/database";

const FALLBACK_HERO_IMG =
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=80";

// How much extra scroll distance (relative to one viewport) drives the
// animation before the section releases and normal scrolling continues.
const SCROLL_MULTIPLIER = 2.4;

function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

export default function HeroStory({ settings, bestSeller }: { settings: SiteSettings | null; bestSeller?: MenuItem | null }) {
  const heroImg = settings?.hero_image_url || FALLBACK_HERO_IMG;
  const storyImg = settings?.about_image_url || heroImg;

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

  const storyBadgeRef = useRef<HTMLSpanElement>(null);
  const storyHeadingRef = useRef<HTMLHeadingElement>(null);
  const storyBodyRef = useRef<HTMLParagraphElement>(null);
  const storyBlockRef = useRef<HTMLDivElement>(null);

  const bestSellerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ticking = false;

    function apply(progress: number) {
      // Phase 1 (0 -> 0.55): image splits apart, hero text exits left.
      const splitP = clamp(progress / 0.55);
      // Phase 2 (0.4 -> 1): story content rises in from the bottom.
      const storyP = clamp((progress - 0.4) / 0.6);

      // --- Image halves: diagonal split, opposite directions ---
      const shift = splitP * 65; // vw/vh-ish percentage of travel
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

      // --- Hero text: staggered exit to the left ---
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

      // --- Best seller showcase: drifts right and fades out alongside
      // the hero text (same badgeP-style timing as the hero badge). ---
      if (bestSellerRef.current) {
        bestSellerRef.current.style.transform = `translateX(${badgeP * 100}px)`;
        bestSellerRef.current.style.opacity = String(1 - badgeP);
        bestSellerRef.current.style.pointerEvents = badgeP > 0.5 ? "none" : "auto";
      }

      // --- Story text: staggered entrance from below ---
      const sBadgeP = clamp(storyP / 0.55);
      const sHeadingP = clamp((storyP - 0.12) / 0.55);
      const sBodyP = clamp((storyP - 0.24) / 0.55);

      // --- Second background image: crossfades in behind the split as
      // the "Our Story" content takes over the screen. ---
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

    function update() {
      ticking = false;
      const el = wrapperRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;

      if (scrollable <= 0) {
        apply(0);
        return;
      }

      const raw = -rect.top / scrollable;
      const progress = reducedMotion ? (raw > 0.05 ? 1 : 0) : clamp(raw);
      apply(progress);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      id="hero-header"
      className="relative"
      style={{ height: `${SCROLL_MULTIPLIER * 100}vh` }}
    >
      {/* Anchor for the "Our Story" nav link — lands roughly where the
          story content takes over, without breaking the pinned scrub. */}
      <span id="about" className="absolute left-0 w-px h-px" style={{ top: "42%" }} aria-hidden="true" />

      <div className="sticky top-0 h-screen w-full overflow-hidden bg-caffeine-dark">
        {/* Second background image: revealed underneath once the hero
            image splits apart, dedicated to the "Our Story" section. */}
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

        {/* Hero text (exits left on scroll) */}
        <div
          ref={heroTextBlockRef}
          className="absolute inset-0 flex items-center px-5 sm:px-12 lg:px-20 xl:px-32 pt-16 sm:pt-20"
        >
          <div className="relative z-10 w-full max-w-2xl lg:max-w-3xl space-y-4 sm:space-y-6">
            <span
              ref={heroBadgeRef}
              className="inline-block text-[10px] sm:text-xs uppercase font-bold tracking-widest text-stone-100 bg-white/10 border border-white/15 backdrop-blur-sm px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-2xl will-change-transform"
            >
              Open Daily
            </span>
            <h1
              ref={heroHeadingRef}
              className="font-cozy text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-tight will-change-transform"
            >
              {settings?.hero_headline || "Good coffee, good people."}
            </h1>
            <p
              ref={heroBodyRef}
              className="text-stone-300 text-xs sm:text-base lg:text-lg font-normal leading-relaxed max-w-xl will-change-transform"
            >
              {settings?.hero_subtext ||
                "We keep things simple: carefully roasted beans, house-made syrups, and a warm neighborhood spot to sit back and catch your breath."}
            </p>

            <div ref={heroCueRef} className="pt-4 flex items-center gap-2 text-sm lg:text-base font-bold text-stone-200">
              <span>Scroll to read our story</span>
              <svg
                className="w-5 h-5 lg:w-6 lg:h-6 animate-bounce"
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

        {/* Best seller showcase: floating product callout, tucked into
            the empty space to the right of the hero text on large
            screens. Only renders when a menu item is flagged as the
            best seller. */}
        {bestSeller && (
          <div
            ref={bestSellerRef}
            className="hidden lg:flex absolute right-10 xl:right-20 top-1/2 -translate-y-1/2 z-10 items-center gap-5 max-w-sm will-change-transform"
          >
            <div className="animate-gentle-float relative shrink-0">
              <div
                className="absolute inset-0 rounded-full bg-caffeine-gold/30 blur-3xl scale-110"
                aria-hidden="true"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bestSeller.image_url || FALLBACK_HERO_IMG}
                alt={bestSeller.name}
                className="relative w-40 xl:w-52 h-40 xl:h-52 object-contain drop-shadow-2xl opacity-95"
              />
              <span className="absolute -top-2 -right-2 w-16 h-16 xl:w-[4.5rem] xl:h-[4.5rem] rounded-full bg-caffeine-gold text-caffeine-dark text-[9px] xl:text-[10px] font-bold uppercase flex items-center justify-center text-center leading-tight border-4 border-caffeine-dark shadow-lg rotate-[8deg]">
                Best
                <br />
                Seller
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl px-5 py-4">
              <p className="font-cozy font-bold text-white text-base xl:text-lg leading-snug">{bestSeller.name}</p>
              {bestSeller.description && (
                <p className="text-stone-300 text-xs xl:text-sm mt-1.5 line-clamp-3 leading-relaxed">
                  {bestSeller.description}
                </p>
              )}
              <p className="text-caffeine-gold font-cozy font-bold text-sm xl:text-base mt-2">
                ${Number(bestSeller.price).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Story text (enters from bottom on scroll) */}
        <div ref={storyBlockRef} className="absolute inset-0 flex items-center px-6 sm:px-12 lg:px-20 xl:px-32">
          <div className="relative z-20 w-full max-w-screen-2xl mx-auto">
            <div className="max-w-3xl lg:max-w-4xl space-y-6">
              <span
                ref={storyBadgeRef}
                className="inline-block text-xs uppercase font-bold tracking-widest text-stone-100 bg-white/10 border border-white/15 backdrop-blur-sm px-4 py-1.5 rounded-2xl will-change-transform"
              >
                Our Roots
              </span>
              <h2
                ref={storyHeadingRef}
                className="font-cozy text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white will-change-transform"
              >
                {settings?.about_headline || "Built around the neighborhood."}
              </h2>
              <p
                ref={storyBodyRef}
                className="text-stone-300 text-xs sm:text-base lg:text-lg leading-relaxed font-normal will-change-transform"
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
