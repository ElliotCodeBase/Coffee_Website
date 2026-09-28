"use client";

import { useEffect, useRef } from "react";
import type { SiteSettings } from "@/types/database";
import AmbientParticles from "@/components/site/AmbientParticles";

const FALLBACK_HERO_IMG =
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80";
const FALLBACK_STORY_IMG =
  "https://images.unsplash.com/photo-1752756992329-961db6366376?auto=format&fit=crop&w=1600&q=80";

/* Foreground cup-splash art layered above the diagonal hero halves (see
   HeroStory's split mechanic below). This is a static design asset, not an
   admin-editable field — it's a transparent foreground cutout, not a
   full-bleed background photo, so it doesn't fit `hero_image_url`'s
   existing meaning and isn't swapped by the admin. */
const HERO_CUP_IMG = "/hero/coffee-cup-hero.png";

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
  const cupRef = useRef<HTMLImageElement>(null);
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
  const storyCardRef = useRef<HTMLDivElement>(null);

  function handleHeroCtaClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const target = document.querySelector("#menu");
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
      if (cupRef.current) {
        cupRef.current.style.opacity = String(1 - splitP);
        cupRef.current.style.transform = `translateY(${-splitP * 40}px) scale(${1 - splitP * 0.08})`;
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
      if (storyCardRef.current) {
        storyCardRef.current.style.transform = `translateY(${(1 - sBadgeP) * 32}px) scale(${0.94 + sBadgeP * 0.06})`;
        storyCardRef.current.style.opacity = String(sBadgeP);
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
        {/* Cozy ambient particles — sits above the photo layers, below the
            text (z-[8], between the cup art's z-5 and the text's z-10/20)
            so it reads as atmosphere, never as a distraction. */}
        <AmbientParticles className="z-[8]" />

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

        {/* Decorative accent blob behind the cup art — one per view, per the
            reference's "spend the boldness in one place" cue. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[2%] top-1/2 -translate-y-1/2 w-[70vw] max-w-2xl aspect-square rounded-full bg-caffeine-accent/25 blur-3xl"
        />

        {/* Foreground cup-splash art. Its own layer (not part of the
            diagonal-split background halves) so it can be a transparent
            cutout; faded/lifted out on the same splitP curve as the hero
            text so it disappears into the reveal rather than sitting static. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={cupRef}
          src={HERO_CUP_IMG}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-[2%] w-[78%] xs:w-[62%] sm:w-[52%] lg:w-[44%] xl:w-[40%] max-w-xl z-[5] will-change-transform select-none opacity-90 sm:opacity-100"
        />

        {/* Hero text — mobile-first sizing */}
        <div
          ref={heroTextBlockRef}
          className="absolute inset-0 flex items-center px-5 sm:px-10 lg:px-20 xl:px-32 pt-14 sm:pt-18 lg:pt-22"
        >
          <div className="relative z-10 w-full max-w-xl sm:max-w-2xl lg:max-w-3xl space-y-3 sm:space-y-5">
            <span
              ref={heroBadgeRef}
              className="inline-block text-[9px] sm:text-[10px] lg:text-xs uppercase font-bold tracking-widest text-stone-100 border border-white/20 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-lg will-change-transform"
            >
              Open Daily
            </span>
            <h1
              ref={heroHeadingRef}
              className="font-cozy text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-tight will-change-transform"
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

            <a
              href="#menu"
              onClick={(e) => handleHeroCtaClick(e)}
              className="inline-flex items-center gap-2 bg-caffeine-accent hover:brightness-110 text-white text-xs sm:text-sm font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-black/20 will-change-transform"
            >
              See the menu
            </a>

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

        {/* Story text — mobile-first sizing */}
        <div
          ref={storyBlockRef}
          className="absolute inset-0 flex items-center px-5 sm:px-10 lg:px-20 xl:px-32"
        >
          <div className="relative z-20 w-full max-w-screen-2xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
            <div className="max-w-xl sm:max-w-2xl lg:max-w-none space-y-4 sm:space-y-6 order-2 lg:order-1">
              <span
                ref={storyBadgeRef}
                className="inline-block text-[9px] sm:text-xs uppercase font-bold tracking-widest text-stone-100 border border-white/20 px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg will-change-transform"
              >
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

            {/* Framed photo card — echoes the reference's layered photo-tile
                motif using the same about image, plus one accent blob. */}
            <div className="relative order-1 lg:order-2 hidden sm:block will-change-transform" ref={storyCardRef}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 lg:-inset-10 rounded-full bg-caffeine-accent/20 blur-3xl"
              />
              <div className="relative aspect-[4/3] w-full max-w-md mx-auto rounded-2xl overflow-hidden border-4 border-caffeine-cream/10 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={storyImg}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
