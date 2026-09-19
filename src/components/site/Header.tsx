"use client";

import { useEffect, useMemo, useState } from "react";
import type { MenuItem, NavLink, SiteSettings } from "@/types/database";

/**
 * Scroll offset (px) at which the header switches to its "condensed"
 * state: the featured ticker collapses, the bar shrinks, and the
 * background goes from translucent to near-solid.
 */
const CONDENSE_AT = 48;

export default function Header({
  navLinks,
  settings,
  menuItems = [],
}: {
  navLinks: NavLink[];
  settings: SiteSettings | null;
  menuItems?: MenuItem[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [condensed, setCondensed] = useState(false);

  // Items called out on the ticker and in the floating showcase.
  const featured = useMemo(
    () => menuItems.filter((i) => i.is_available && (i.is_best_seller || i.is_new)),
    [menuItems]
  );
  const showcase = featured.find((i) => i.is_best_seller && i.image_url) ?? null;

  // The header animation this restores: the bar reacts to scroll position.
  // It was lost when Header.tsx was rewritten — the keyframes
  // (infinite-scroll / gentle-float) were left orphaned in globals.css with
  // nothing referencing them.
  useEffect(() => {
    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setCondensed(window.scrollY > CONDENSE_AT);
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("#")) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  }

  // Duplicated once so the -50% keyframe translate loops seamlessly.
  const tickerItems = featured.length > 0 ? [...featured, ...featured] : [];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 text-white border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-500 ease-out ${
        condensed
          ? "bg-caffeine-dark/95 backdrop-blur-xl border-white/10 shadow-lg shadow-black/20"
          : "bg-caffeine-dark/70 backdrop-blur-md border-white/5 shadow-none"
      }`}
    >
      {/* ── Featured ticker — collapses away once you start scrolling ── */}
      {tickerItems.length > 0 && (
        <div
          aria-hidden={condensed}
          className={`overflow-hidden border-b border-white/5 bg-black/20 transition-[max-height,opacity] duration-500 ease-out ${
            condensed ? "max-h-0 opacity-0" : "max-h-10 opacity-100"
          }`}
        >
          <div className="relative flex overflow-hidden">
            <div className="carousel-track animate-infinite-scroll flex shrink-0 items-center gap-8 whitespace-nowrap py-2 pr-8">
              {tickerItems.map((item, i) => (
                <span
                  key={`${item.id}-${i}`}
                  className="flex items-center gap-2 text-[10px] sm:text-[11px] font-medium tracking-wide text-stone-300"
                >
                  <span
                    className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
                      item.is_best_seller
                        ? "bg-caffeine-gold/90 text-caffeine-dark"
                        : "bg-green-500/90 text-white"
                    }`}
                  >
                    {item.is_best_seller ? "Best Seller" : "New"}
                  </span>
                  <span className="text-white">{item.name}</span>
                  <span className="text-stone-400">${Number(item.price).toFixed(2)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main bar — shrinks as you scroll ── */}
      <div
        className={`max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-4 transition-[height] duration-500 ease-out ${
          condensed ? "h-12 sm:h-14 lg:h-16" : "h-14 sm:h-18 lg:h-22"
        }`}
      >
        {/* Logo / business name */}
        <a
          href="#hero-header"
          onClick={(e) => handleNavClick(e, "#hero-header")}
          className="font-cozy font-bold tracking-tight text-white flex items-center gap-2 sm:gap-3 shrink-0 group"
        >
          {settings?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_url}
              alt={settings.logo_alt || `${settings.business_name} logo`}
              className={`object-contain transition-[width,height] duration-500 ease-out ${
                condensed ? "w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" : "w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9"
              }`}
            />
          ) : (
            <svg
              className={`text-caffeine-cream group-hover:text-white transition-all duration-500 ease-out ${
                condensed ? "w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" : "w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"
              />
            </svg>
          )}
          <span
            className={`truncate max-w-[120px] sm:max-w-none transition-[font-size] duration-500 ease-out ${
              condensed ? "text-base sm:text-lg lg:text-2xl" : "text-lg sm:text-xl lg:text-3xl"
            }`}
          >
            {settings?.business_name || "Caffeine"}
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-9 xl:gap-11 text-sm lg:text-base font-medium text-stone-300 flex-1 justify-center">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="group relative hover:text-white transition-colors whitespace-nowrap py-1"
            >
              {link.label}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-0 -bottom-0.5 h-px w-full origin-left scale-x-0 bg-caffeine-gold transition-transform duration-300 ease-out group-hover:scale-x-100"
              />
            </a>
          ))}
        </nav>

        {/* Floating best-seller showcase. Absolutely positioned so it can
            hang below the bar without changing the header's height (and so
            it never shifts the hero's top padding). */}
        <div className="hidden md:block relative w-32 lg:w-40 shrink-0">
          {showcase && (
            <div
              className={`absolute right-0 top-1/2 -translate-y-1/2 transition-all duration-500 ease-out ${
                condensed ? "opacity-0 translate-y-2 pointer-events-none" : "opacity-100"
              }`}
            >
              <a
                href="#menu"
                onClick={(e) => handleNavClick(e, "#menu")}
                className="animate-gentle-float flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 py-1.5 pl-1.5 pr-3 backdrop-blur-md transition-colors hover:border-caffeine-gold/60 hover:bg-white/15"
              >
                <span className="relative block h-9 w-9 lg:h-10 lg:w-10 shrink-0 overflow-hidden rounded-xl bg-caffeine-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={showcase.image_url!}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                </span>
                <span className="flex flex-col leading-tight min-w-0">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-caffeine-gold">
                    Best Seller
                  </span>
                  <span className="truncate text-[11px] font-semibold text-white max-w-[72px] lg:max-w-[88px]">
                    {showcase.name}
                  </span>
                </span>
              </a>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle Navigation Menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          className="md:hidden p-2 text-stone-200 hover:text-white focus:outline-none shrink-0"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              className="transition-opacity duration-200"
              d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {/* Mobile backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={`md:hidden fixed inset-0 -z-10 bg-black/50 transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Mobile dropdown — animated open/close instead of a hard mount */}
      <div
        id="mobile-nav"
        className={`md:hidden overflow-hidden border-t border-white/10 bg-caffeine-dark/95 backdrop-blur-md transition-[max-height,opacity] duration-300 ease-out ${
          mobileOpen ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              tabIndex={mobileOpen ? 0 : -1}
              className="block w-full text-left px-3 py-3 text-sm font-medium text-stone-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {link.label}
            </a>
          ))}
          {/* No Staff Portal link — access via /admin/login directly */}
        </div>
      </div>
    </header>
  );
}
