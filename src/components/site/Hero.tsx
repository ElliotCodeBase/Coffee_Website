import type { SiteSettings } from "@/types/database";

const FALLBACK_HERO_IMG =
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=80";

export default function Hero({ settings }: { settings: SiteSettings | null }) {
  const heroImg = settings?.hero_image_url || FALLBACK_HERO_IMG;

  return (
    <section id="hero-header" className="relative bg-caffeine-dark flex items-center min-h-screen px-6 sm:px-12 lg:px-20 xl:px-32 pt-20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={heroImg}
        alt="Cozy coffee shop interior"
        className="absolute inset-0 w-full h-full object-cover opacity-60"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-caffeine-dark/95 via-caffeine-dark/70 to-caffeine-dark/30" />

      <div className="relative z-10 w-full max-w-2xl lg:max-w-3xl space-y-6">
        <span className="inline-block text-xs uppercase font-bold tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/40 px-4 py-1.5 rounded-2xl">
          Open Daily
        </span>
        <h1 className="font-cozy text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-white leading-tight">
          {settings?.hero_headline || "Good coffee, good people."}
        </h1>
        <p className="text-stone-300 text-sm sm:text-lg lg:text-xl font-normal leading-relaxed max-w-xl">
          {settings?.hero_subtext ||
            "We keep things simple: carefully roasted beans, house-made syrups, and a warm neighborhood spot to sit back and catch your breath."}
        </p>
        <div className="pt-4">
          <a
            href="#about"
            className="inline-flex items-center gap-2 text-sm lg:text-base font-bold text-amber-300 hover:text-amber-200 transition-colors"
          >
            <span>Read our story</span>
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
