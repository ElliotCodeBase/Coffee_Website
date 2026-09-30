"use client";

import { scrollToSection } from "@/lib/scroll-to-section";
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
  const BADGE_TEXT = `${(settings?.business_name || "Come by").toUpperCase().slice(0, 16)} \u2022 OUR STORY \u2022 `;

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
  const glowRef = useRef<HTMLDivElement>(null);

  function handleHeroCtaClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!document.querySelector("#menu")) return;
    e.preventDefault();
    scrollToSection("#menu");
  }

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let heroDone = false;
    let storyOn = false;
    function apply(progress: number) {
      /* Slow ambient drift/glow only runs while it can be seen: the hero
         halves are ~invisible once split, and the story photo is invisible
         until the story starts. Flipping these two classes is what lets the
         browser stop compositing three full-screen animated layers. */
      const nowDone = progress > 0.62;
      const nowStory = progress > 0.4;
      if (nowDone !== heroDone || nowStory !== storyOn) {
        heroDone = nowDone;
        storyOn = nowStory;
        wrapperRef.current?.classList.toggle("hero-done", heroDone);
        wrapperRef.current?.classList.toggle("story-on", storyOn);
      }
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
      // The warm lamplight belongs to the hero only; it is gone before the
      // story photo is fully in, so the photo stays clean.
      if (glowRef.current) {
        glowRef.current.style.opacity = String(1 - clamp((progress - 0.36) / 0.2));
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

    /* The loop only runs while there is something to animate: it wakes on
       scroll, eases toward the target, and goes back to sleep once settled.
       (It used to run every frame forever, re-writing ~25 style properties
       even when nothing had moved.) */
    let rafId: number | null = null;
    let smoothed = computeProgress();
    let inView = true;

    function loop() {
      rafId = null;
      const target = computeProgress();
      if (reducedMotion) {
        smoothed = target;
      } else {
        smoothed += (target - smoothed) * EASE_FACTOR;
        if (Math.abs(target - smoothed) < 0.0006) smoothed = target;
      }
      apply(smoothed);
      if (smoothed !== target) rafId = requestAnimationFrame(loop);
    }

    function wake() {
      if (inView && rafId === null) rafId = requestAnimationFrame(loop);
    }
    function stopLoop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    apply(smoothed);
    window.addEventListener("scroll", wake, { passive: true });

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) wake();
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
    const onLoad = () => {
      smoothed = computeProgress();
      apply(smoothed);
    };
    window.addEventListener("load", onLoad);

    return () => {
      stopLoop();
      window.removeEventListener("scroll", wake);
      window.removeEventListener("load", onLoad);
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
              className="hero-drift hero-drift--story absolute inset-0 w-full h-full object-cover"
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
              "linear-gradient(0deg, color-mix(in srgb, var(--caffeine-dark) 80%, transparent) 0%, transparent 34%), color-mix(in srgb, var(--caffeine-dark) 66%, transparent)",
          }}
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
            decoding="async"
            fetchPriority="high"
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
        <div ref={glowRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-glow absolute -right-[12%] -top-[14%] h-[88%] w-[78%]" />
        </div>

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

        {/* Story text: a centered editorial layout. Label and headline on
            top, a hairline, then the lead sentence and the rest of the story
            side by side. White type only. The refs are the ones the scroll
            code above reveals. */}
        <div
          ref={storyBlockRef}
          className="absolute inset-0 flex items-center justify-center px-5 sm:px-10 lg:px-16 xl:px-24 pt-16 sm:pt-20 lg:pt-24 pb-24 sm:pb-28 lg:pb-32"
        >
          <div className="relative z-20 w-full max-w-6xl text-center">
            <div
              ref={storyKickerRef}
              className="mb-4 sm:mb-6 flex items-center justify-center gap-4 will-change-transform"
              style={{ opacity: 0 }}
            >
              <span aria-hidden="true" className="h-px w-10 sm:w-20 bg-gradient-to-r from-transparent to-white/70" />
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.42em] text-white">Our Story</span>
              <span aria-hidden="true" className="h-px w-10 sm:w-20 bg-gradient-to-l from-transparent to-white/70" />
            </div>

            <h2
              className="font-cozy font-bold tracking-tight leading-[1.02] text-white text-balance"
              style={{ fontSize: "clamp(2.3rem, min(9.5vh, 8.4vw), 6.6rem)" }}
            >
              {storyHeadlineWords.map((word, i) => (
                <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em]">
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

            {/* Hairline with a light that keeps travelling along it. */}
            <span
              ref={storyRuleRef}
              aria-hidden="true"
              className="story-hairline relative mx-auto mt-6 sm:mt-8 block h-px w-full max-w-3xl origin-center overflow-hidden bg-white/25 will-change-transform"
              style={{ transform: "scaleX(0)" }}
            >
              <span className="story-hairline__light absolute inset-y-0 left-0 block w-1/4 bg-gradient-to-r from-transparent via-white to-transparent" />
            </span>

            <div ref={storyBodyRef} className="mt-6 sm:mt-9 will-change-transform">
              <div className="mx-auto grid max-w-5xl gap-5 text-left md:grid-cols-[1.15fr_1fr] md:items-start md:gap-x-14 md:gap-y-0">
                <p
                  className="font-cozy font-bold leading-snug text-white text-pretty text-center md:text-left"
                  style={{ fontSize: "clamp(1.1rem, min(3.3vh, 4.8vw), 2.05rem)" }}
                >
                  {storyLead}
                </p>
                <div className="md:border-l md:border-white/25 md:pl-10 text-center md:text-left">
                  {storyRest && (
                    <p className="leading-relaxed text-white/90" style={{ fontSize: "clamp(0.86rem, 1.95vh, 1.08rem)" }}>
                      {storyRest}
                    </p>
                  )}
                  <a
                    ref={storyLinkRef}
                    href="#location"
                    className="story-link group mt-5 sm:mt-6 inline-flex items-center gap-3 rounded-full border border-white/70 py-2 pl-5 pr-2 text-sm sm:text-base font-semibold text-white transition-colors duration-300 hover:bg-white hover:text-caffeine-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white will-change-transform"
                    style={{ opacity: 0 }}
                  >
                    Come find us
                    <span className="story-arrow flex h-8 w-8 items-center justify-center rounded-full bg-white text-caffeine-dark transition-colors duration-300 group-hover:bg-caffeine-dark group-hover:text-white">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* A ring of text turning slowly in the corner. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 120 120"
            className="story-badge pointer-events-none absolute bottom-24 right-8 hidden h-28 w-28 text-white/80 lg:block xl:bottom-28 xl:right-16 xl:h-32 xl:w-32"
          >
            <defs>
              <path id="story-badge-ring" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
            </defs>
            <text fill="currentColor" fontSize="10.5" fontWeight="700" letterSpacing="2">
              <textPath href="#story-badge-ring" textLength="272" lengthAdjust="spacing">
                {BADGE_TEXT}
              </textPath>
            </text>
          </svg>
        </div>
      </div>

    </div>
  );
}
