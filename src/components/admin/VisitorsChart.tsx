"use client";

import { useState } from "react";
import type { ChartPoint, Granularity } from "@/lib/analytics";

const TABS: { key: Granularity; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

// Plain HTML/CSS bars rather than a hand-rolled SVG. The previous SVG
// version used a non-uniform viewBox (percentage-based x/width mixed
// with fixed-unit y) with `preserveAspectRatio="none"`, which stretched
// every text label horizontally into an unreadable squiggle — this
// avoids that class of bug entirely, since normal HTML text is never
// subject to that kind of axis-independent scaling.

function VerticalBars({ points }: { points: ChartPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  return (
    <div className="flex items-end gap-1.5 sm:gap-2 h-[220px] px-1">
      {points.map((p, i) => {
        const heightPct = p.count === 0 ? 0 : Math.max((p.count / max) * 100, 4);
        return (
          <div key={i} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full">
            <span className="text-[10px] sm:text-xs font-bold text-caffeine-dark mb-1 tabular-nums">
              {p.count > 0 ? p.count : ""}
            </span>
            <div className="w-full flex items-end justify-center flex-1">
              <div
                className={`w-full rounded-t-sm transition-all ${p.count > 0 ? "bg-caffeine-accent" : "bg-stone-200"}`}
                style={{ height: `${heightPct}%` }}
                title={`${p.label}: ${p.count} visit${p.count === 1 ? "" : "s"}`}
              />
            </div>
            <span className="text-[9px] sm:text-[11px] text-stone-500 mt-2 text-center leading-tight whitespace-nowrap">
              {p.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Used for Daily specifically: 30 bars is too many labels to fit legibly
// underneath vertical bars, so each day gets its own row instead — date
// on the side, a horizontal bar, and the count at the end. Scrolls
// vertically within a fixed-height panel rather than shrinking text.
function HorizontalBars({ points }: { points: ChartPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const reversed = [...points].reverse(); // most recent day at the top
  return (
    <div className="h-[280px] overflow-y-auto pr-1 space-y-2">
      {reversed.map((p, i) => {
        const widthPct = p.count === 0 ? 0 : Math.max((p.count / max) * 100, 3);
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="w-14 sm:w-16 shrink-0 text-[11px] sm:text-xs text-stone-600 font-medium text-right">
              {p.label}
            </span>
            <div className="flex-1 h-4 bg-stone-100 rounded-sm overflow-hidden">
              <div
                className={`h-full rounded-sm transition-all ${p.count > 0 ? "bg-caffeine-accent" : ""}`}
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-[11px] sm:text-xs font-bold text-caffeine-dark tabular-nums">
              {p.count > 0 ? p.count : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function VisitorsChart({
  data,
  totalVisits,
}: {
  data: Record<Granularity, ChartPoint[]>;
  totalVisits: number;
}) {
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const points = data[granularity];
  const hasAnyVisits = points.some((p) => p.count > 0);

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-cozy font-bold text-lg text-caffeine-dark">Site visitors</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            {totalVisits.toLocaleString()} total visits logged since your database was set up.
          </p>
        </div>

        <div className="flex border border-stone-300 rounded-md overflow-hidden shrink-0">
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setGranularity(tab.key)}
              className={`px-3.5 py-2 text-sm font-medium transition-colors ${
                i > 0 ? "border-l border-stone-300" : ""
              } ${
                granularity === tab.key
                  ? "bg-caffeine-dark text-white"
                  : "bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!hasAnyVisits ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-stone-400 border border-dashed border-stone-300 rounded-lg">
          No visits recorded in this range yet.
        </div>
      ) : granularity === "daily" ? (
        <HorizontalBars points={points} />
      ) : (
        <VerticalBars points={points} />
      )}
    </div>
  );
}
