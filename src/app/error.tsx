"use client";

import { useEffect } from "react";

/* Next's own error boundary for this route segment. The header and page
   body already have their own SectionErrorBoundary (see page.tsx), so in
   normal operation a data failure never reaches this far. This exists as
   a last-resort net for anything outside that — a bug in code added
   later that isn't wrapped, or an error thrown during the initial HTML
   stream before React has hydrated enough to run a component-level
   boundary. It intentionally does not try to reproduce the header. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route-level error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-caffeine-cream flex items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full text-center">
        <p className="text-xs sm:text-sm uppercase font-bold tracking-widest text-caffeine-accent mb-3">
          Something went wrong
        </p>
        <h1 className="font-cozy text-3xl sm:text-4xl font-bold text-caffeine-dark mb-4">
          This page hit a snag.
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-8">
          Please try again. If this keeps happening, refresh in a few minutes.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-caffeine-dark hover:bg-caffeine-card text-white font-bold px-6 py-3 text-sm rounded-2xl transition-colors active:scale-95"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
