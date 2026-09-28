"use client";

import { useEffect, useRef } from "react";
import type { SiteSettings } from "@/types/database";
import DripEdge from "@/components/site/DripEdge";

const FALLBACK_HERO_IMG =
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80";
const FALLBACK_STORY_IMG =
  "https://images.unsplash.com/photo-1752756992329-961db6366376?auto=format&fit=crop&w=1600&q=80";

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

  const heroCtaRef = useRef<HTMLDivElement>(null);
  const heroHeadingRef = useRef<HTMLHeadingElement>(null);
  const heroBodyRef = useRef<HTMLParagraphElement>(null);
  const heroCueRef = useRef<HTMLDivElement>(null);
  const heroTextBlockRef = useRef<HTMLDivElement>(null);

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
      const ctaP = clamp((splitP - 0.22) / 0.55);
      const headingP = clamp((splitP - 0.08) / 0.55);
      const bodyP = clamp((splitP - 0.18) / 0.55);
      const cueP = clamp(splitP / 0.35);

      if (heroHeadingRef.current) {
        heroHeadingRef.current.style.transform = `translateX(${-headingP * 160}px)`;
        heroHeadingRef.current.style.opacity = String(1 - headingP);
      }
      if (heroBodyRef.current) {
        heroBodyRef.current.style.transform = `translateX(${-bodyP * 140}px)`;
        heroBodyRef.current.style.opacity = String(1 - bodyP);
      }
      /* The CTA sits on a wrapper that only the scroll loop transforms — the
         button inside keeps its own hover/press transitions. (Before, the
         button had no ref at all, so it stayed put while everything around
         it slid away.) */
      if (heroCtaRef.current) {
        heroCtaRef.current.style.transform = `translateX(${-ctaP * 150}px)`;
        heroCtaRef.current.style.opacity = String(1 - ctaP);
      }
      if (heroCueRef.current) {
        heroCueRef.current.style.opacity = String(1 - cueP);
      }
      if (heroTextBlockRef.current) {
        heroTextBlockRef.current.style.pointerEvents = splitP > 0.5 ? "none" : "auto";
      }

      const sCardP = clamp(storyP / 0.55);
      const sHeadingP = clamp((storyP - 0.12) / 0.55);
      const sBodyP = clamp((storyP - 0.24) / 0.55);

      if (storyImgRef.current) {
        storyImgRef.current.style.opacity = String(storyP);
      }
      if (storyOverlayRef.current) {
        storyOverlayRef.current.style.opacity = String(storyP);
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
        storyCardRef.current.style.transform = `translateY(${(1 - sCardP) * 32}px) scale(${0.94 + sCardP * 0.06})`;
        storyCardRef.current.style.opacity = String(sCardP);
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

  /* First sentence of the story is set large as a lead; the rest follows in body type. */
  const storyFull =
    settings?.about_body ||
    "We started with a simple idea: create a room where locals could slow down, put their phones away for a minute, and actually taste their coffee. What began as a handful of tables and a secondhand espresso machine has grown into a daily stop for the neighborhood — but the idea hasn't changed. We source beans in small batches, roast them ourselves, and pull every shot the same careful way whether it's your first visit or your five-hundredth. Come for the coffee, stay for the people who've made this place feel like home.";
  const leadMatch = storyFull.match(/^([\s\S]+?[.!?])(\s+|$)/);
  const storyLead = leadMatch ? leadMatch[1] : storyFull;
  const storyRest = leadMatch ? storyFull.slice(leadMatch[0].length).trim() : "";

  const headlineWords = (settings?.hero_headline || "Good coffee, good people.").split(" ");

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

        {/* Diagonal image halves. The scroll loop moves/fades these two
            wrappers; the slow "cozy" drift lives on the <img> inside each
            (.hero-drift), a different element, so the loop and the split
            can never fight over the same transform. */}
        <div
          ref={halfARef}
          className="absolute inset-0 will-change-transform"
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImg}
            alt="Cozy coffee shop interior"
            className="hero-drift absolute inset-0 w-full h-full object-cover opacity-60"
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
            className="hero-drift absolute inset-0 w-full h-full object-cover opacity-60"
            loading="eager"
          />
        </div>

        <div
          ref={overlayRef}
          className="absolute inset-0 bg-gradient-to-r from-caffeine-dark/95 via-caffeine-dark/70 to-caffeine-dark/30 will-change-[opacity]"
        />

        {/* Warm lamplight that slowly breathes over the whole panel. */}
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0" />

        {/* Hero text */}
        <div
          ref={heroTextBlockRef}
          className="absolute inset-0 flex items-center px-5 sm:px-10 lg:px-20 xl:px-32 pt-14 sm:pt-18 lg:pt-22"
        >
          <div className="relative z-10 w-full max-w-xl sm:max-w-2xl lg:max-w-3xl space-y-4 sm:space-y-6">
            <h1
              ref={heroHeadingRef}
              className="font-cozy text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-white leading-[1.05] text-balance will-change-transform"
            >
              {headlineWords.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em]">
                  <span className="hero-word inline-block" style={{ animationDelay: `${0.12 + i * 0.09}s` }}>
                    {word}
                    {i < headlineWords.length - 1 ? "\u00A0" : ""}
                  </span>
                </span>
              ))}
            </h1>
            <p
              ref={heroBodyRef}
              className="text-stone-200 text-sm sm:text-base lg:text-lg xl:text-xl font-normal leading-relaxed max-w-md sm:max-w-xl will-change-transform"
            >
              <span className="hero-fade block" style={{ animationDelay: "0.55s" }}>
                {settings?.hero_subtext ||
                  "We keep things simple: carefully roasted beans, house-made syrups, and a warm neighborhood spot to sit back and catch your breath."}
              </span>
            </p>

            <div ref={heroCtaRef} className="will-change-transform">
              <a
                href="#menu"
                onClick={(e) => handleHeroCtaClick(e)}
                className="hero-fade group inline-flex items-center gap-3 rounded-full bg-caffeine-drip hover:bg-white text-caffeine-dark text-sm sm:text-base font-bold pl-6 sm:pl-7 pr-2 py-2 shadow-lg shadow-black/25 transition-[background-color,transform] duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-caffeine-gold"
                style={{ animationDelay: "0.75s" }}
              >
                <span>See the menu</span>
                <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-caffeine-dark text-caffeine-drip transition-transform duration-300 ease-out group-hover:translate-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                  </svg>
                </span>
              </a>
            </div>

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

        {/* Story text */}
        <div
          ref={storyBlockRef}
          className="absolute inset-0 flex items-center px-5 sm:px-10 lg:px-20 xl:px-32 pb-24 sm:pb-28 lg:pb-32"
        >
          <div className="relative z-20 w-full max-w-screen-2xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            <div className="lg:col-span-7 max-w-2xl lg:max-w-none space-y-4 sm:space-y-6">
              <h2
                ref={storyHeadingRef}
                className="font-cozy text-3xl xs:text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.05] text-white text-balance will-change-transform"
              >
                {settings?.about_headline || "Built around the neighborhood."}
              </h2>
              <div ref={storyBodyRef} className="space-y-3 sm:space-y-4 will-change-transform">
                <p className="font-cozy text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold leading-snug text-caffeine-drip text-pretty">
                  {storyLead}
                </p>
                {storyRest && (
                  <p className="max-w-2xl text-[clamp(0.85rem,1.9vh,1.15rem)] leading-relaxed text-stone-200 border-t border-white/15 pt-3 sm:pt-4">
                    {storyRest}
                  </p>
                )}
              </div>
            </div>

            {/* Arched window onto the shop: the photo sits in a tall arch with a
                second outline arch offset behind it, and floats gently. The
                scroll loop transforms the wrapper; the float is on the inner
                element so the two never share a transform. */}
            <div className="relative lg:col-span-5 hidden sm:block will-change-transform" ref={storyCardRef}>
              <div className="story-float relative mx-auto w-full max-w-[17rem] lg:max-w-sm">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 translate-x-4 translate-y-4 lg:translate-x-6 lg:translate-y-6 rounded-t-full rounded-b-3xl border-2 border-caffeine-gold/60"
                />
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-full rounded-b-3xl shadow-2xl shadow-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={storyImg}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Milk pours off the bottom of the story panel into the menu. */}
      <DripEdge />
    </div>
  );
}
