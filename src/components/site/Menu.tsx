"use client";

import { useState } from "react";
import type { MenuItem } from "@/types/database";

const DEFAULT_DRINK_IMG =
  "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=700&q=75";
const DEFAULT_FOOD_IMG =
  "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=75";

// Rows shown before the visitor asks for "See more", and the size of each
// extra batch after that.
const PREVIEW_COUNT = 6;
const BATCH = 8;

type CategoryKey = "drinks" | "pastries";

const CATEGORIES: { key: CategoryKey; label: string; fallbackImg: string }[] = [
  { key: "drinks", label: "Espresso & Cold Drinks", fallbackImg: DEFAULT_DRINK_IMG },
  { key: "pastries", label: "Pastries & Morning Bites", fallbackImg: DEFAULT_FOOD_IMG },
];

function markFor(item: MenuItem) {
  return item.is_best_seller ? "Best seller" : item.is_new ? "New" : null;
}

/* The lead item: one big photo beside its name, price and description.
   Only shown when the category has a Best Seller / New item to lead with. */
function FeatureItem({ item, fallbackImg }: { item: MenuItem; fallbackImg: string }) {
  const mark = markFor(item);
  return (
    <article className="menu-rise grid sm:grid-cols-5 gap-6 sm:gap-10 items-center mb-12 sm:mb-16">
      <div className="sm:col-span-2 relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-[2rem] rounded-tr-[5rem] bg-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url || fallbackImg}
          alt={item.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-105"
        />
      </div>
      <div className="sm:col-span-3">
        {mark && (
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-caffeine-gold">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-caffeine-gold" />
            {mark}
          </p>
        )}
        <h4 className="font-cozy text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.05] text-white text-balance">
          {item.name}
        </h4>
        {item.description && (
          <p className="mt-4 max-w-md text-base sm:text-lg leading-relaxed text-stone-300">{item.description}</p>
        )}
        <p className="mt-5 font-cozy text-3xl sm:text-4xl font-bold text-caffeine-gold tabular-nums">
          ${Number(item.price).toFixed(2)}
        </p>
      </div>
    </article>
  );
}

function MenuRow({ item, fallbackImg, index }: { item: MenuItem; fallbackImg: string; index: number }) {
  const mark = markFor(item);
  return (
    <li
      className="menu-rise group flex gap-4 sm:gap-5 py-5 sm:py-6 border-b border-white/10"
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image_url || fallbackImg}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
      </div>
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-baseline justify-between gap-4">
          <h4 className="min-w-0 font-cozy text-lg sm:text-xl lg:text-2xl font-bold leading-snug text-white line-clamp-2">
            {item.name}
          </h4>
          <span className="shrink-0 font-cozy text-lg sm:text-xl lg:text-2xl font-bold text-caffeine-gold tabular-nums">
            ${Number(item.price).toFixed(2)}
          </span>
        </div>
        {(mark || item.badge) && (
          <p className="mt-1 flex items-center gap-2 text-xs sm:text-sm font-bold text-caffeine-gold">
            {mark && (
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-caffeine-gold" />
                {mark}
              </span>
            )}
            {item.badge && <span className="font-normal text-stone-300">{item.badge}</span>}
          </p>
        )}
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-sm sm:text-base leading-relaxed text-stone-300">{item.description}</p>
        )}
      </div>
    </li>
  );
}

function sortForDisplay(list: MenuItem[]): MenuItem[] {
  // Best Seller / New items lead (in the admin's order); the rest are alphabetical.
  const featured = list.filter((i) => i.is_best_seller || i.is_new);
  const rest = [...list.filter((i) => !i.is_best_seller && !i.is_new)].sort((a, b) => a.name.localeCompare(b.name));
  return [...featured, ...rest];
}

export default function Menu({ items }: { items: MenuItem[] }) {
  const [active, setActive] = useState<CategoryKey>("drinks");
  const [shown, setShown] = useState(PREVIEW_COUNT);

  const category = CATEGORIES.find((c) => c.key === active)!;
  const list = sortForDisplay(items.filter((i) => i.category === active));
  const lead = list[0] && markFor(list[0]) ? list[0] : null;
  const rows = lead ? list.slice(1) : list;
  const visibleRows = rows.slice(0, shown);
  const canShowMore = rows.length > shown;

  function pick(key: CategoryKey) {
    setActive(key);
    setShown(PREVIEW_COUNT);
  }

  return (
    <section
      id="menu"
      className="relative scroll-mt-16 sm:scroll-mt-20 lg:scroll-mt-24 pt-36 sm:pt-48 lg:pt-60 pb-20 sm:pb-28 lg:pb-36 bg-caffeine-dark text-white px-5 sm:px-12 lg:px-20"
    >
      <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-4 lg:sticky lg:top-32 self-start">
          <h2 className="font-cozy text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.02] text-balance">
            What we&apos;re serving
          </h2>
          <p className="mt-4 sm:mt-5 max-w-sm text-base sm:text-lg text-stone-300 leading-relaxed">
            Everything from classic morning espresso to fresh-baked croissants straight out of the oven.
          </p>

          <div role="tablist" aria-label="Menu categories" className="mt-8 sm:mt-10 flex lg:flex-col gap-x-6 gap-y-1 overflow-x-auto -mx-1 px-1">
            {CATEGORIES.map((c) => {
              const isActive = c.key === active;
              return (
                <button
                  key={c.key}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => pick(c.key)}
                  className={`group relative shrink-0 text-left py-2 font-cozy text-lg sm:text-xl lg:text-2xl font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-caffeine-gold ${
                    isActive ? "text-white" : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {c.label}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 -bottom-0.5 h-0.5 w-full origin-left bg-caffeine-gold transition-transform duration-300 ease-out ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* key remounts the panel on tab change so the rows rise in again */}
        <div key={active} role="tabpanel" className="lg:col-span-8">
          {lead && <FeatureItem item={lead} fallbackImg={category.fallbackImg} />}

          {rows.length === 0 && !lead ? (
            <p className="text-stone-400 text-sm">No items yet — check back soon.</p>
          ) : (
            <ul className="border-t border-white/10 lg:grid lg:grid-cols-2 lg:gap-x-12">
              {visibleRows.map((item, i) => (
                <MenuRow key={item.id} item={item} fallbackImg={category.fallbackImg} index={i} />
              ))}
            </ul>
          )}

          {(canShowMore || shown > PREVIEW_COUNT) && rows.length > PREVIEW_COUNT && (
            <div className="flex justify-center mt-10 sm:mt-12">
              {canShowMore ? (
                <button
                  type="button"
                  onClick={() => setShown((n) => n + BATCH)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-white border border-white/30 hover:bg-white/10 px-6 py-3 rounded-full transition-[background-color,transform] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-caffeine-gold"
                >
                  See more
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShown(PREVIEW_COUNT)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-caffeine-gold hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-caffeine-gold"
                >
                  Show less
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
