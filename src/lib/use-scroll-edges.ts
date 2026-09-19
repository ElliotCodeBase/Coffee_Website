"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ScrollEdges {
  /** True when the content is wider than the box (there is something to scroll to). */
  scrollable: boolean;
  atStart: boolean;
  atEnd: boolean;
}

const NOT_SCROLLABLE: ScrollEdges = { scrollable: false, atStart: true, atEnd: true };

/* Tracks whether a horizontally scrolling element can scroll further left or
   right, so the shared side-scroll styles (edge fade, arrow buttons) only show
   when they mean something. Used by <HScroller> and by the admin tab rail so
   every side-scroll on the site behaves the same way.

   `changeKey` should change when items are added or removed. Sizes changing on
   their own (window resize, images loading) are picked up automatically. */
export function useScrollEdges<T extends HTMLElement>(changeKey: unknown = 0) {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState<ScrollEdges>(NOT_SCROLLABLE);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const left = Math.abs(el.scrollLeft); // abs(): scrollLeft is negative in right-to-left layouts
    const next: ScrollEdges =
      max > 1 ? { scrollable: true, atStart: left <= 1, atEnd: left >= max - 1 } : NOT_SCROLLABLE;
    setEdges((prev) =>
      prev.scrollable === next.scrollable && prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next
    );
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    const observer = new ResizeObserver(update);
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));
    update();

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [update, changeKey]);

  /** Scroll by most of a visible page. Respects the reduced-motion setting. */
  const scrollByPage = useCallback((direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  }, []);

  return { ref, edges, scrollByPage };
}
