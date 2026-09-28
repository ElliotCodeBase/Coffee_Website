"use client";

import { useState } from "react";
import type { MenuItem } from "@/types/database";

const DEFAULT_DRINK_IMG =
  "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=500&q=75";
const DEFAULT_FOOD_IMG =
  "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=75";

// How many items show before the visitor has to click "See more".
const PREVIEW_COUNT = 6;
// Once expanded, items beyond the preview are grouped into extra sections
// of this size instead of dumping everything into one huge grid.
const SECTION_LIMIT = 8;

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

/* A menu board, not a card grid: photo, name, dotted leader, price, and a
   line of description. Two columns on large screens, one on phones. */
function MenuList({ items, fallbackImg }: { items: MenuItem[]; fallbackImg: string }) {
  if (items.length === 0) {
    return <p className="text-stone-400 text-sm">No items yet — check back soon.</p>;
  }
  return (
    <ul className="grid lg:grid-cols-2 gap-x-14 xl:gap-x-20 gap-y-7 sm:gap-y-9">
      {items.map((item) => {
        const mark = item.is_best_seller ? "Best seller" : item.is_new ? "New" : null;
        return (
          <li key={item.id} className="group flex gap-4 sm:gap-5">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl bg-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url || fallbackImg}
                loading="lazy"
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-3">
                <h4 className="min-w-0 truncate font-cozy text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  {item.name}
                </h4>
                <span aria-hidden="true" className="flex-1 min-w-4 -translate-y-1 border-b border-dotted border-white/30" />
                <span className="font-cozy text-lg sm:text-xl lg:text-2xl font-bold text-caffeine-gold tabular-nums">
                  ${Number(item.price).toFixed(2)}
                </span>
              </div>
              {(mark || item.badge) && (
                <p className="mt-1 flex items-center gap-2 text-xs font-bold text-caffeine-gold">
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
                <p className="mt-1.5 line-clamp-2 text-sm sm:text-base leading-relaxed text-stone-300">
                  {item.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
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
    <div className="mb-16 sm:mb-24 last:mb-0">
      <h3 className="font-cozy text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-7 sm:mb-10 border-b border-white/15 pb-3 sm:pb-4">
        {title}
      </h3>

      <MenuList items={preview} fallbackImg={fallbackImg} />

      {sections.slice(0, visibleSections).map((section, idx) => (
        <div key={idx} className="mt-9 sm:mt-12 pt-9 sm:pt-12 border-t border-dashed border-white/15">
          <MenuList items={section} fallbackImg={fallbackImg} />
        </div>
      ))}

      {(hasMore || isExpanded) && remainder.length > 0 && (
        <div className="flex justify-center mt-9 sm:mt-12">
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisibleSections((v) => v + 1)}
              className="inline-flex items-center gap-2 text-sm font-bold text-white border border-white/30 hover:bg-white/10 px-6 py-3 rounded-full transition-[background-color,transform] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-caffeine-gold"
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
              className="inline-flex items-center gap-2 text-sm font-bold text-caffeine-gold hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-caffeine-gold"
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
    <section
      id="menu"
      className="relative scroll-mt-16 sm:scroll-mt-20 lg:scroll-mt-24 pt-36 sm:pt-48 lg:pt-60 pb-16 sm:pb-24 lg:pb-32 bg-caffeine-dark text-white px-5 sm:px-12 lg:px-20"
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="max-w-3xl mb-12 sm:mb-16 lg:mb-20">
          <h2 className="font-cozy text-3xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] text-balance mb-4 sm:mb-5">
            What we&apos;re serving
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-stone-300 leading-relaxed">
            Everything from classic morning espresso to fresh-baked croissants straight out of the oven.
          </p>
        </div>

        <CategorySection title="Espresso & Cold Drinks" items={drinks} fallbackImg={DEFAULT_DRINK_IMG} />
        <CategorySection title="Pastries & Morning Bites" items={pastries} fallbackImg={DEFAULT_FOOD_IMG} />
      </div>
    </section>
  );
}
