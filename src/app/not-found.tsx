import Link from "next/link";
import { getSiteSettings } from "@/lib/data/public";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-caffeine-cream flex items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full text-center">
        <svg
          className="w-14 h-14 mx-auto mb-6 text-caffeine-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"
          />
        </svg>
        <p className="text-xs sm:text-sm uppercase font-bold tracking-widest text-caffeine-accent mb-3">
          404 error
        </p>
        <h1 className="font-cozy text-3xl sm:text-4xl font-bold text-caffeine-dark mb-4">
          This page has gone cold.
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-8">
          We couldn&apos;t find the page you were looking for. It may have moved, or the link might be out of
          date{settings?.business_name ? ` — either way, ${settings.business_name} is still brewing.` : "."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-caffeine-dark hover:bg-caffeine-card text-white font-bold px-6 py-3 text-sm rounded-2xl transition-colors active:scale-95"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
