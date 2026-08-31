"use client";

import { useState } from "react";
import Link from "next/link";
import type { NavLink, SiteSettings } from "@/types/database";

export default function Header({ navLinks, settings }: { navLinks: NavLink[]; settings: SiteSettings | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-caffeine-dark/75 backdrop-blur-xl text-white border-b border-white/10 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 h-16 sm:h-20 lg:h-24 flex items-center justify-between">
        <Link href="/" className="font-cozy text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3 group">
          {settings?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_url}
              alt={settings.logo_alt || `${settings.business_name} logo`}
              className="w-7 h-7 lg:w-9 lg:h-9 object-contain"
            />
          ) : (
            <svg className="w-7 h-7 lg:w-9 lg:h-9 text-caffeine-cream group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
            </svg>
          )}
          <span>{settings?.business_name || "Caffeine"}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-10 xl:gap-12 text-sm lg:text-base font-medium text-stone-300">
          {navLinks.map((link) => (
            <a key={link.id} href={link.href} className="hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/admin/login"
            className="text-xs lg:text-sm bg-caffeine-card hover:bg-caffeine-border text-stone-200 border border-stone-700/80 px-5 py-2.5 rounded-full transition-all font-semibold active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 04-8 0v4h8z" />
            </svg>
            <span>Staff Portal</span>
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle Navigation Menu"
          aria-expanded={mobileOpen}
          className="md:hidden p-2 text-stone-200 hover:text-white focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-caffeine-dark border-b border-caffeine-border px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block w-full text-left text-sm font-medium text-stone-300 hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/admin/login"
            className="w-full text-left text-xs bg-caffeine-card hover:bg-caffeine-border px-3 py-2.5 rounded-xl border border-stone-700 text-white transition-colors mt-2 font-semibold active:scale-95 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 04-8 0v4h8z" />
            </svg>
            <span>Staff Portal</span>
          </Link>
        </div>
      )}
    </header>
  );
}
