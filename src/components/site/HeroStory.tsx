"use client";

import { useEffect, useRef } from "react";
import type { SiteSettings } from "@/types/database";

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

  const storyKickerRef = useRef<HTMLDivElement>(null);
  const storyWordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const storyBodyRef = useRef<HTMLParagraphElement>(null);
  const storyLinkRef = useRef<HTMLAnchorElement>(null);
  const storyBlockRef = useRef<HTMLDivElement>(null);
  const storyRuleRef = useRef<HTMLSpanElement>(null);
  const storyImgParallaxRef = useRef<HTMLDivElement>(null);

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

      /* Kicker leads, then the headline words cascade in one after another
         (same clip-and-rise idea as the hero, but scroll-driven so it can
         run in reverse if the visitor scrolls back up), then the rule
         draws, then body copy, then the link — five small beats instead
         of two big blocks fading in together. */
      const sKickerP = clamp((storyP - 0.04) / 0.4);
      const sHeadingBaseP = clamp((storyP - 0.1) / 0.4);
      const sRuleP = clamp((storyP - 0.24) / 0.4);
      const sBodyP = clamp((storyP - 0.32) / 0.5);
      const sLinkP = clamp((storyP - 0.46) / 0.5);

      if (storyImgRef.current) {
        storyImgRef.current.style.opacity = String(storyP);
      }
      if (storyImgParallaxRef.current) {
        const settle = 1 - storyP;
        storyImgParallaxRef.current.style.transform = `scale(${1 + settle * 0.16}) translateY(${settle * -3}%)`;
      }
      if (storyOverlayRef.current) {
        storyOverlayRef.current.style.opacity = String(storyP);
      }

      if (storyKickerRef.current) {
        storyKickerRef.current.style.transform = `translateY(${(1 - sKickerP) * 18}px)`;
        storyKickerRef.current.style.opacity = String(sKickerP);
      }
      const wordCount = storyWordRefs.current.length || 1;
      storyWordRefs.current.forEach((el, i) => {
        if (!el) return;
        // Each word reveals slightly after the last: a real cascade, not a
        // single block moving together.
        const wp = clamp((sHeadingBaseP - (i / wordCount) * 0.5) / 0.5);
        el.style.transform = `translateY(${(1 - wp) * 130}%)`;
      });
      if (storyRuleRef.current) {
        storyRuleRef.current.style.transform = `scaleX(${sRuleP})`;
      }
      if (storyBodyRef.current) {
        storyBodyRef.current.style.transform = `translateY(${(1 - sBodyP) * 40}px)`;
        storyBodyRef.current.style.opacity = String(sBodyP);
      }
      if (storyLinkRef.current) {
        storyLinkRef.current.style.transform = `translateY(${(1 - sLinkP) * 24}px)`;
        storyLinkRef.current.style.opacity = String(sLinkP);
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
  const storyHeadlineWords = (settings?.about_headline || "Built around the neighborhood.").split(" ");

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
        <div ref={storyImgRef} className="absolute inset-0 overflow-hidden will-change-[opacity]" style={{ opacity: 0 }}>
          {/* Two independent transforms, two elements: this wrapper eases
              from a slight zoom-out as the story reveals (scroll-driven),
              while the <img> inside runs its own always-on cozy drift. */}
          <div ref={storyImgParallaxRef} className="absolute inset-0 will-change-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={storyImg}
              alt=""
              aria-hidden="true"
              className="hero-drift absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        {/* Dark on the text side, open on the photo side; a floor fade keeps the
            milk drip edge clean. On phones the text spans the width, so a flat
            wash sits under it. */}
        <div
          ref={storyOverlayRef}
          className="absolute inset-0 will-change-[opacity]"
          style={{
            opacity: 0,
            background:
              "linear-gradient(0deg, color-mix(in srgb, var(--caffeine-dark) 85%, transparent) 0%, transparent 38%), linear-gradient(90deg, color-mix(in srgb, var(--caffeine-dark) 94%, transparent) 0%, color-mix(in srgb, var(--caffeine-dark) 74%, transparent) 42%, color-mix(in srgb, var(--caffeine-dark) 8%, transparent) 100%)",
          }}
        >
          <div className="absolute inset-0 bg-caffeine-dark/55 lg:hidden" />
          {/* Steam: slow looping wisps rising on the open side of the panel. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-[6%] hidden w-[34%] lg:block">
            {[0, 1, 2, 3].map((n) => (
              <svg
                key={n}
                viewBox="0 0 60 220"
                className="story-wisp absolute bottom-[8%]"
                style={{ left: `${8 + n * 22}%`, width: `${9 + (n % 2) * 4}%`, animationDelay: `${-n * 3.1}s`, animationDuration: `${11 + n * 1.7}s` }}
              >
                <path
                  d="M30 220 C8 185 52 165 30 130 C8 95 52 75 30 40 C20 20 34 8 30 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            ))}
          </div>
        </div>

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

        {/* Story text: one confident column on the dark side of the photo. */}
        <div
          ref={storyBlockRef}
          className="absolute inset-0 flex items-center px-5 sm:px-10 lg:px-20 xl:px-32 pt-16 sm:pt-20 lg:pt-24 pb-24 sm:pb-28 lg:pb-32"
        >
          <div className="relative z-20 w-full max-w-2xl xl:max-w-[42rem]">
            <div
              ref={storyKickerRef}
              className="mb-4 sm:mb-5 flex items-center gap-3 will-change-transform"
              style={{ opacity: 0 }}
            >
              <span aria-hidden="true" className="story-kicker-dot h-2 w-2 rounded-full bg-caffeine-gold" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.32em] text-caffeine-gold">Our Story</span>
              <span aria-hidden="true" className="h-px w-10 sm:w-16 bg-gradient-to-r from-caffeine-gold/70 to-transparent" />
            </div>

            <h2
              className="font-cozy font-bold tracking-tight leading-[1.02] text-white text-balance"
              style={{ fontSize: "clamp(2.1rem, min(7.4vh, 9vw), 5.6rem)" }}
            >
              {storyHeadlineWords.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
                  <span
                    ref={(el) => {
                      storyWordRefs.current[i] = el;
                    }}
                    className={`inline-block will-change-transform ${
                      i === storyHeadlineWords.length - 1 ? "story-shine" : ""
                    }`}
                    style={{ transform: "translateY(130%)" }}
                  >
                    {word}
                    {i < storyHeadlineWords.length - 1 ? "\u00A0" : ""}
                  </span>
                </span>
              ))}
            </h2>

            <span
              ref={storyRuleRef}
              aria-hidden="true"
              className="mt-5 sm:mt-7 block h-[3px] w-28 origin-left rounded-full bg-gradient-to-r from-caffeine-gold to-caffeine-gold/0 will-change-transform"
              style={{ transform: "scaleX(0)" }}
            />

            <div ref={storyBodyRef} className="mt-5 sm:mt-7 will-change-transform">
              {/* The lead sentence hangs off a gold rail with a light that
                  keeps travelling down it. */}
              <div className="relative pl-5 sm:pl-7">
                <span aria-hidden="true" className="absolute left-0 top-1 bottom-1 w-[2px] overflow-hidden rounded-full bg-caffeine-gold/25">
                  <span className="story-trace absolute left-0 top-0 block h-10 w-full rounded-full bg-gradient-to-b from-transparent via-caffeine-gold to-transparent" />
                </span>
                <p
                  className="font-cozy font-bold leading-snug text-caffeine-drip text-pretty"
                  style={{ fontSize: "clamp(1.1rem, min(3.1vh, 4.8vw), 2rem)" }}
                >
                  {storyLead}
                </p>
                {storyRest && (
                  <p
                    className="mt-3 sm:mt-4 max-w-xl leading-relaxed text-stone-200"
                    style={{ fontSize: "clamp(0.86rem, 1.95vh, 1.1rem)" }}
                  >
                    {storyRest}
                  </p>
                )}
              </div>
              <a
                ref={storyLinkRef}
                href="#location"
                className="story-link group mt-5 sm:mt-6 ml-5 sm:ml-7 inline-flex items-center gap-3 rounded-full border border-caffeine-gold/60 py-2 pl-5 pr-2 text-sm sm:text-base font-bold text-caffeine-gold transition-colors duration-300 hover:bg-caffeine-gold hover:text-caffeine-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-caffeine-gold will-change-transform"
                style={{ opacity: 0 }}
              >
                Come find us
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-caffeine-gold text-caffeine-dark transition-transform duration-300 ease-out group-hover:translate-x-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
