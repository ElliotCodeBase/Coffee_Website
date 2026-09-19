"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

/* A centered overlay for editing something without moving the page.

   Why it exists: the menu editor used to swap a card for a full-width form
   *inside* the card grid. The grid uses `auto-rows-fr`, which makes every
   row as tall as the tallest one — so the form stretched all the cards and
   often opened far below the fold. An overlay leaves the page layout alone
   and always appears in the middle of the viewport.

   Behavior: rendered in a portal on <body>; page scroll locks while open;
   the panel itself scrolls when content is tall (the footer stays visible if
   the caller makes it sticky); Escape and the close button dismiss it; Tab
   stays inside; focus returns to whatever opened it. If the user has typed
   anything, dismissing by Escape or clicking outside asks before discarding. */
export default function AdminModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const dirtyRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  function requestClose() {
    if (dirtyRef.current && !window.confirm("Discard your unsaved changes?")) return;
    onCloseRef.current();
  }
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => el.offsetParent !== null);

    /* Land on the first form field, not the close button. */
    const first = panel?.querySelector<HTMLElement>("input, select, textarea") ?? focusables()[0];
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstEl || !panel?.contains(active))) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && (active === lastEl || !panel?.contains(active))) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onInput={() => {
          dirtyRef.current = true;
        }}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-200 px-5 py-4 sm:px-6">
          <h2 id={titleId} className="min-w-0 truncate font-cozy text-base font-bold text-caffeine-dark">
            {title}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="-mr-2 rounded-md p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-caffeine-dark"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
