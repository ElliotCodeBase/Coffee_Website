import type { SiteSettings } from "@/types/database";

export default function Footer({ settings }: { settings: SiteSettings | null }) {
  return (
    <footer className="relative bg-caffeine-dark text-stone-400 py-12 border-t border-caffeine-border text-xs sm:text-sm lg:text-base">
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-12 lg:px-20 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div>
          <a href="#hero-header" className="font-cozy text-2xl lg:text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-3">
            <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
            </svg>
            <span>{settings?.business_name || "Caffeine"}</span>
          </a>
          <p className="text-stone-400 mt-2 font-normal">
            {settings?.footer_copyright || `© ${new Date().getFullYear()} All rights reserved.`}
          </p>
        </div>
        <div className="flex gap-8 font-medium">
          <a href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </a>
          <a href="/terms" className="hover:text-white transition-colors">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
