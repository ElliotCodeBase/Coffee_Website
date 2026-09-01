"use client";

import { useState } from "react";
import type { MenuItem } from "@/types/database";

const DEFAULT_DRINK_IMG =
  "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=500&q=75";
const DEFAULT_FOOD_IMG =
  "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=75";

// How many items show before the visitor has to click "See more".
const PREVIEW_COUNT = 4;
// Once expanded, items beyond the preview are grouped into extra sections
// of this size instead of dumping everything into one huge grid.
const SECTION_LIMIT = 8;

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

function MenuGrid({ items, fallbackImg }: { items: MenuItem[]; fallbackImg: string }) {
  if (items.length === 0) {
    return <p className="text-stone-500 text-xs sm:text-sm">No items yet — check back soon.</p>;
  }
  return (
    <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6 lg:gap-8">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-caffeine-cream p-1.5 sm:p-6 lg:p-7 rounded-lg sm:rounded-3xl border border-stone-300/80 shadow-sm flex flex-col justify-between transition-transform duration-200 ease-out hover:-translate-y-1.5 hover:shadow-xl"
        >
          <div>
            <div className="relative aspect-square sm:aspect-[4/3] w-full rounded-md sm:rounded-2xl bg-stone-200 overflow-hidden mb-1.5 sm:mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url || fallbackImg}
                loading="lazy"
                alt={item.name}
                className="w-full h-full object-cover"
              />
              {(item.is_best_seller || item.is_new) && (
                <span
                  className={`absolute top-1 left-1 sm:top-2 sm:left-2 text-[7px] sm:text-[10px] font-bold uppercase px-1.5 sm:px-2.5 py-0.5 rounded-full shadow-sm ${
                    item.is_best_seller ? "bg-caffeine-gold text-caffeine-dark" : "bg-green-500 text-white"
                  }`}
                >
                  {item.is_best_seller ? "Best Seller" : "New"}
                </span>
              )}
            </div>
            <h4 className="font-cozy font-bold text-[10px] leading-tight sm:text-xl lg:text-2xl text-caffeine-dark flex items-center justify-between">
              <span className="line-clamp-2 sm:line-clamp-1">{item.name}</span>
              {item.badge && (
                <span className="hidden sm:inline-block text-[10px] sm:text-[11px] lg:text-xs bg-caffeine-tan text-caffeine-accent px-2 sm:px-2.5 py-0.5 rounded-full font-sans font-bold ml-2">
                  {item.badge}
                </span>
              )}
            </h4>
            <p className="hidden sm:block text-xs sm:text-sm lg:text-base text-stone-600 font-normal mt-1.5 sm:mt-2 mb-3 sm:mb-4 leading-relaxed">
              {item.description}
            </p>
          </div>
          <div className="border-t border-stone-200 pt-1 sm:pt-4 mt-1 sm:mt-0 flex justify-between items-center">
            <span className="font-cozy font-bold text-[11px] sm:text-xl lg:text-2xl text-caffeine-accent">
              ${Number(item.price).toFixed(2)}
            </span>
            <span className="hidden sm:inline-block text-[11px] sm:text-xs lg:text-sm font-medium bg-caffeine-tan text-caffeine-dark px-2.5 sm:px-3 py-1 rounded-2xl">
              In-Store
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategorySection({
  title,
  items,
  fallbackImg,
}: {
  title: string;
  items: MenuItem[];
  fallbackImg: string;
}) {
  const [visibleSections, setVisibleSections] = useState(0);

  const preview = items.slice(0, PREVIEW_COUNT);
  const remainder = items.slice(PREVIEW_COUNT);
  const sections = chunk(remainder, SECTION_LIMIT);
  const hasMore = visibleSections < sections.length;
  const isExpanded = visibleSections > 0;

  return (
    <div className="mb-14 sm:mb-20 lg:mb-28 last:mb-0">
      <h3 className="font-cozy text-xl sm:text-3xl lg:text-4xl font-bold text-caffeine-dark mb-5 sm:mb-8 border-b border-caffeine-dark/20 pb-2 sm:pb-3">
        {title}
      </h3>

      <MenuGrid items={preview} fallbackImg={fallbackImg} />

      {sections.slice(0, visibleSections).map((section, idx) => (
        <div key={idx} className="mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-dashed border-caffeine-dark/15">
          <p className="text-[11px] sm:text-xs uppercase font-bold tracking-widest text-caffeine-accent mb-4 sm:mb-6">
            More {title}
          </p>
          <MenuGrid items={section} fallbackImg={fallbackImg} />
        </div>
      ))}

      {(hasMore || isExpanded) && remainder.length > 0 && (
        <div className="flex justify-center mt-8 sm:mt-10">
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisibleSections((v) => v + 1)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-caffeine-dark bg-caffeine-cream hover:bg-white border border-stone-300 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all active:scale-95 shadow-sm"
            >
              <span>See more</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setVisibleSections(0)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-caffeine-accent hover:text-caffeine-dark transition-colors"
            >
              <span>Show less</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Menu({ items }: { items: MenuItem[] }) {
  // Best Seller / New items are pinned to the front of their category
  // (in whatever order the admin set them) — everything else is sorted
  // alphabetically by name.
  function sortForDisplay(list: MenuItem[]): MenuItem[] {
    const featured = list.filter((i) => i.is_best_seller || i.is_new);
    const rest = [...list.filter((i) => !i.is_best_seller && !i.is_new)].sort((a, b) => a.name.localeCompare(b.name));
    return [...featured, ...rest];
  }

  const drinks = sortForDisplay(items.filter((i) => i.category === "drinks"));
  const pastries = sortForDisplay(items.filter((i) => i.category === "pastries"));

  return (
    <section id="menu" className="relative py-14 sm:py-20 lg:py-32 bg-caffeine-tan px-5 sm:px-12 lg:px-20 border-b border-stone-300">
      <div className="max-w-screen-2xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 lg:mb-20">
          <span className="inline-block text-[11px] sm:text-xs uppercase font-bold tracking-widest text-caffeine-accent bg-caffeine-cream/80 border border-stone-300 px-3.5 sm:px-4 py-1.5 rounded-2xl mb-3 sm:mb-4">
            Fresh Daily
          </span>
          <h2 className="font-cozy text-2xl sm:text-5xl lg:text-6xl font-bold text-caffeine-dark mb-3 sm:mb-4">
            What we&apos;re serving
          </h2>
          <p className="text-xs sm:text-lg lg:text-xl text-stone-700 font-normal">
            Everything from classic morning espresso to fresh-baked croissants straight out of the oven.
          </p>
        </div>

        <CategorySection title="Espresso & Cold Drinks" items={drinks} fallbackImg={DEFAULT_DRINK_IMG} />
        <CategorySection title="Pastries & Morning Bites" items={pastries} fallbackImg={DEFAULT_FOOD_IMG} />
      </div>
    </section>
  );
}
