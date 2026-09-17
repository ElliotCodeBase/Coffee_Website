"use client";

import { useState } from "react";
import type { NavLink, SiteSettings } from "@/types/database";

export default function Header({ navLinks, settings }: { navLinks: NavLink[]; settings: SiteSettings | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("#")) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-caffeine-dark/75 backdrop-blur-xl text-white border-b border-white/10 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 lg:px-12 h-14 sm:h-18 lg:h-22 flex items-center justify-between gap-4">
        {/* Logo / business name */}
        <a
          href="#hero-header"
          onClick={(e) => handleNavClick(e, "#hero-header")}
          className="font-cozy text-lg sm:text-xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-2 sm:gap-3 shrink-0 group"
        >
          {settings?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_url}
              alt={settings.logo_alt || `${settings.business_name} logo`}
              className="w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9 object-contain"
            />
          ) : (
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9 text-caffeine-cream group-hover:text-white transition-colors"
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
          <span className="truncate max-w-[120px] sm:max-w-none">
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
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Spacer to balance the logo on desktop (no portal link shown publicly) */}
        <div className="hidden md:block w-32 lg:w-40 shrink-0" aria-hidden="true" />

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle Navigation Menu"
          aria-expanded={mobileOpen}
          className="md:hidden p-2 text-stone-200 hover:text-white focus:outline-none shrink-0"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-caffeine-dark/95 backdrop-blur-md border-t border-white/10 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block w-full text-left px-3 py-3 text-sm font-medium text-stone-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {link.label}
            </a>
          ))}
          {/* No Staff Portal link — access via /admin/login directly */}
        </div>
      )}
    </header>
  );
}
