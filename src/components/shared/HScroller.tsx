"use client";

import { Children } from "react";
import { useScrollEdges } from "@/lib/use-scroll-edges";

/* The one side-scrolling pattern used across the site.

   - Swipe / trackpad / shift-wheel scrolling with snap points.
   - The next item is left partly visible ("peek") so it's obvious there is more.
   - The edges fade only on the side that has more content.
   - Previous / next buttons appear on devices with a mouse, and only when the
     content actually overflows. Hidden at each end.
   - Keyboard: Tab to the strip, then Left / Right arrows.
   - No scrollbar chrome; respects reduced-motion.

   Each child becomes one item. Styles live in globals.css (.hscroll*). */
export default function HScroller({
  label,
  children,
  itemWidth = "min(78%, 17rem)",
  gap = "1rem",
  className = "",
}: {
  /** Describes the strip to screen-reader users, e.g. "Drinks". */
  label: string;
  children: React.ReactNode;
  /** CSS width of one item. The default leaves the next card peeking in. */
  itemWidth?: string;
  gap?: string;
  className?: string;
}) {
  const items = Children.toArray(children);
  const { ref, edges, scrollByPage } = useScrollEdges<HTMLDivElement>(items.length);

  return (
    <div
      className={`hscroll ${className}`}
      data-scrollable={edges.scrollable}
      data-start={edges.atStart}
      data-end={edges.atEnd}
      style={{ ["--hscroll-item" as string]: itemWidth, ["--hscroll-gap" as string]: gap }}
    >
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="hscroll__track"
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return; // don't steal arrows from inputs inside items
          if (e.key === "ArrowRight") {
            e.preventDefault();
            scrollByPage(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            scrollByPage(-1);
          }
        }}
      >
        {items.map((child, i) => (
          <div key={(child as { key?: string | null }).key ?? i} className="hscroll__item">
            {child}
          </div>
        ))}
      </div>

      {edges.scrollable && (
        <>
          <button
            type="button"
            className="hscroll__btn hscroll__btn--prev"
            aria-label={`Scroll ${label} left`}
            disabled={edges.atStart}
            onClick={() => scrollByPage(-1)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            className="hscroll__btn hscroll__btn--next"
            aria-label={`Scroll ${label} right`}
            disabled={edges.atEnd}
            onClick={() => scrollByPage(1)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
