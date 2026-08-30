import type { SiteSettings } from "@/types/database";

export default function About({ settings }: { settings: SiteSettings | null }) {
  return (
    <section id="about" className="relative py-20 lg:py-32 bg-caffeine-dark text-white px-6 sm:px-12 lg:px-20 border-b border-caffeine-border">
      <div className="max-w-screen-2xl mx-auto max-w-3xl space-y-6">
        <span className="inline-block text-xs uppercase font-bold tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/40 px-4 py-1.5 rounded-2xl">
          Our Roots
        </span>
        <h2 className="font-cozy text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
          {settings?.about_headline || "Built around the neighborhood."}
        </h2>
        <p className="text-stone-300 text-sm sm:text-lg lg:text-xl leading-relaxed font-normal">
          {settings?.about_body ||
            "We started with a simple idea: create a room where locals could slow down."}
        </p>
      </div>
    </section>
  );
}
