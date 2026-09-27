import type { MenuItem, SiteSettings } from "@/types/database";

/* Purely decorative fallbacks — only shown when there isn't real menu
   data yet, so this section never renders empty on a fresh site. */
const FALLBACK_THUMBS = [
  {
    name: "House Blend",
    img: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=75",
  },
  {
    name: "Cold Brew",
    img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=400&q=75",
  },
  {
    name: "Fresh Croissant",
    img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=75",
  },
];

const FALLBACK_RIBBON = ["Espresso", "Cappuccino", "Cold Brew", "Latte", "Mocha", "Americano", "Macchiato"];

function ArrowIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7V15" />
    </svg>
  );
}

function CupIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 2c-.5 1 .5 1.5 0 3M12 2c-.5 1 .5 1.5 0 3" />
    </svg>
  );
}

/* A small, self-contained coffee-cup illustration built from plain shapes
   so it always renders crisply and inherits the site's live theme colors
   (it reads the same CSS variables ThemeVars.tsx writes, via Tailwind's
   caffeine-* classes) instead of being a static image. */
function CupIllustration({ line1, line2 }: { line1: string; line2: string }) {
  return (
    <svg viewBox="0 0 240 300" className="w-full h-full" role="img" aria-labelledby="cup-illustration-title">
      <title id="cup-illustration-title">{line1}</title>

      {/* steam */}
      <g className="text-caffeine-cream/40" stroke="currentColor" strokeWidth={4} strokeLinecap="round" fill="none">
        <path d="M96 38c-6 8 6 12 0 22" className="motion-safe:animate-[caffeine-steam_4s_ease-in-out_infinite]" />
        <path
          d="M124 34c-6 8 6 12 0 22"
          className="motion-safe:animate-[caffeine-steam_4s_ease-in-out_infinite]"
          style={{ animationDelay: "0.8s" }}
        />
        <path
          d="M150 40c-6 8 6 12 0 22"
          className="motion-safe:animate-[caffeine-steam_4s_ease-in-out_infinite]"
          style={{ animationDelay: "1.6s" }}
        />
      </g>

      {/* scattered beans */}
      <g className="text-caffeine-gold/70" fill="currentColor">
        <g transform="translate(34,236) rotate(-25)">
          <ellipse cx="0" cy="0" rx="12" ry="8" />
          <path d="M-8 0h16" stroke="var(--caffeine-dark)" strokeWidth={1.5} />
        </g>
        <g transform="translate(206,206) rotate(20)">
          <ellipse cx="0" cy="0" rx="10" ry="7" />
          <path d="M-7 0h14" stroke="var(--caffeine-dark)" strokeWidth={1.5} />
        </g>
        <g transform="translate(196,90) rotate(-10)" opacity={0.6}>
          <ellipse cx="0" cy="0" rx="8" ry="6" />
          <path d="M-6 0h12" stroke="var(--caffeine-dark)" strokeWidth={1.2} />
        </g>
      </g>

      {/* lid */}
      <ellipse cx="120" cy="70" rx="58" ry="15" className="fill-caffeine-cream/90" />
      <ellipse cx="120" cy="65" rx="48" ry="10" className="fill-caffeine-cream" opacity={0.6} />

      {/* cup body */}
      <path
        d="M67 70 L173 70 L159 258 Q157 274 141 274 L99 274 Q83 274 81 258 Z"
        className="fill-caffeine-gold"
      />
      <path d="M67 70 L173 70 L169 96 L71 96 Z" className="fill-caffeine-dark/15" />

      {/* sleeve */}
      <rect x="72" y="128" width="96" height="66" rx="10" className="fill-caffeine-dark/80" />

      {/* badge */}
      <circle cx="120" cy="161" r="40" className="fill-caffeine-cream" stroke="var(--caffeine-gold)" strokeWidth={2.5} />
      <text
        x="120"
        y="154"
        textAnchor="middle"
        className="fill-caffeine-dark font-cozy font-bold"
        style={{ fontSize: "13px" }}
      >
        {line1}
      </text>
      <text x="120" y="171" textAnchor="middle" className="fill-caffeine-accent font-bold" style={{ fontSize: "8px", letterSpacing: "0.08em" }}>
        {line2.toUpperCase()}
      </text>
    </svg>
  );
}

export default function MenuShowcase({ settings, items }: { settings: SiteSettings | null; items: MenuItem[] }) {
  const drinksCount = items.filter((i) => i.category === "drinks").length;
  const pastriesCount = items.filter((i) => i.category === "pastries").length;

  const quickLinks = [
    { label: "Espresso & Cold Drinks", show: drinksCount > 0 },
    { label: "Pastries & Morning Bites", show: pastriesCount > 0 },
    { label: "Best Sellers", show: items.some((i) => i.is_best_seller) },
    { label: "Fresh on the Menu", show: items.some((i) => i.is_new) },
  ].filter((l) => l.show || items.length === 0);

  const finalLinks = quickLinks.length > 0
    ? quickLinks
    : [{ label: "Espresso & Cold Drinks", show: true }, { label: "Pastries & Morning Bites", show: true }];

  const bestFirst = [...items].sort((a, b) => Number(b.is_best_seller) - Number(a.is_best_seller));
  const thumbs = bestFirst.slice(0, 3).map((i) => ({ name: i.name, img: i.image_url || undefined }));
  const thumbList = thumbs.length > 0 ? thumbs : FALLBACK_THUMBS;

  const ribbonNames = items.length > 0 ? [...new Set(items.map((i) => i.name))].slice(0, 10) : FALLBACK_RIBBON;
  const ribbon = [...ribbonNames, ...ribbonNames];

  const businessName = settings?.business_name || "Our Blend";
  const tagline = settings?.tagline || "Small batch, always fresh";

  return (
    <section className="relative overflow-hidden bg-caffeine-dark pt-14 sm:pt-20 lg:pt-28 pb-10 sm:pb-14 lg:pb-20">
      <style>{`
        @keyframes caffeine-steam { 0%, 100% { opacity: 0.15; transform: translateY(0); } 50% { opacity: 0.6; transform: translateY(-6px); } }
        @keyframes caffeine-float { 0%, 100% { transform: translateY(0) rotate(var(--tilt, 0deg)); } 50% { transform: translateY(-10px) rotate(var(--tilt, 0deg)); } }
        @keyframes caffeine-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>

      <div className="max-w-screen-2xl mx-auto px-5 sm:px-10 lg:px-20 xl:px-32">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1fr] gap-10 lg:gap-6 items-center">
          {/* Quick category nav */}
          <div className="order-2 lg:order-1">
            <p className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-caffeine-gold mb-4 sm:mb-5">
              Jump to
            </p>

            {/* Mobile: horizontal chip row */}
            <div className="flex lg:hidden gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {finalLinks.map((link) => (
                <a
                  key={link.label}
                  href="#menu"
                  className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-100 bg-white/5 border border-white/10 px-3 py-2 rounded-xl whitespace-nowrap transition-colors hover:bg-white/10"
                >
                  {link.label}
                  <ArrowIcon className="w-3 h-3 text-caffeine-gold" />
                </a>
              ))}
            </div>

            {/* Desktop: vertical list */}
            <ul className="hidden lg:block space-y-2">
              {finalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href="#menu"
                    className="group flex items-center justify-between gap-3 text-sm sm:text-base font-bold text-stone-100 border border-white/10 hover:border-caffeine-gold/60 bg-white/5 hover:bg-white/10 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 transition-all"
                  >
                    <span>{link.label}</span>
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-caffeine-gold text-caffeine-dark shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowIcon />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Center: headline + cup illustration + CTA */}
          <div className="order-1 lg:order-2 text-center flex flex-col items-center">
            <span className="inline-block text-[10px] sm:text-xs uppercase font-bold tracking-widest text-caffeine-gold border border-white/15 px-3.5 py-1.5 rounded-2xl mb-4 sm:mb-5">
              Fresh Daily
            </span>
            <h2 className="font-cozy text-2xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 sm:mb-4 max-w-md">
              {tagline}
            </h2>

            <div className="relative w-40 sm:w-52 lg:w-60 aspect-[4/5] my-2 sm:my-4">
              <CupIllustration line1="THE BEST" line2={businessName} />
            </div>

            <a
              href="#menu"
              className="mt-2 sm:mt-4 inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-caffeine-dark bg-caffeine-gold hover:brightness-110 px-6 sm:px-7 py-3 sm:py-3.5 rounded-2xl transition-all active:scale-95 shadow-lg"
            >
              <span>View Full Menu</span>
              <ArrowIcon className="w-4 h-4" />
            </a>
          </div>

          {/* Floating menu-item thumbnails */}
          <div className="order-3 hidden lg:flex flex-col gap-4 items-end pr-2">
            {thumbList.map((thumb, idx) => (
              <div
                key={thumb.name}
                className="motion-safe:animate-[caffeine-float_6s_ease-in-out_infinite] flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2.5 pr-4 shadow-lg"
                style={{
                  animationDelay: `${idx * 0.6}s`,
                  ["--tilt" as string]: idx % 2 === 0 ? "-2deg" : "2deg",
                  marginRight: idx === 1 ? "2.5rem" : undefined,
                }}
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-caffeine-tan shrink-0">
                  {thumb.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb.img} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <span className="text-xs font-bold text-stone-100 max-w-[8rem] leading-snug">{thumb.name}</span>
              </div>
            ))}
          </div>

          {/* Mobile-only compact thumbnail row */}
          <div className="order-3 flex lg:hidden gap-3 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {thumbList.map((thumb) => (
              <div key={thumb.name} className="shrink-0 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 pr-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-caffeine-tan shrink-0">
                  {thumb.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb.img} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <span className="text-[11px] font-bold text-stone-100 whitespace-nowrap">{thumb.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom marquee ribbon */}
      <div className="relative mt-12 sm:mt-16 lg:mt-20 -rotate-2 sm:-rotate-1">
        <div className="bg-caffeine-gold border-y-2 border-caffeine-dark/20 py-2.5 sm:py-3.5 overflow-hidden">
          <div
            className="flex w-max motion-safe:animate-[caffeine-marquee_32s_linear_infinite] hover:[animation-play-state:paused]"
            aria-hidden="true"
          >
            {ribbon.map((name, idx) => (
              <span
                key={`${name}-${idx}`}
                className="flex items-center gap-2.5 sm:gap-3.5 px-4 sm:px-6 text-caffeine-dark font-cozy font-bold text-sm sm:text-lg lg:text-xl uppercase tracking-wide whitespace-nowrap"
              >
                {name}
                <CupIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-60" />
              </span>
            ))}
          </div>
        </div>
        <span className="sr-only">Featuring {ribbonNames.join(", ")}</span>
      </div>
    </section>
  );
}
