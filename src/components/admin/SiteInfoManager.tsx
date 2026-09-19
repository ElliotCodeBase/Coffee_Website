"use client";

import { useState } from "react";
import type { NavLink, SiteSettings, ImageHistoryEntry, ImageHistoryField } from "@/types/database";
import SiteInfoForm from "@/components/admin/SiteInfoForm";
import NavLinksForm from "@/components/admin/NavLinksForm";

export type SiteInfoTab =
  | "brand"
  | "hero"
  | "story"
  | "location"
  | "contact"
  | "social"
  | "seo"
  | "navigation";

const TABS: { id: SiteInfoTab; label: string; icon: string }[] = [
  { id: "brand", label: "Brand", icon: "M7 7h.01M7 3h5a2 2 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A2 2 0 013 10V5a2 2 0 012-2z" },
  { id: "hero", label: "Hero", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { id: "story", label: "Our Story", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { id: "location", label: "Location", icon: "M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: "contact", label: "Contact", icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11 11 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
  { id: "social", label: "Social", icon: "M8.684 13.342a3 3 0 100-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" },
  { id: "seo", label: "Footer & SEO", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { id: "navigation", label: "Navigation", icon: "M4 6h16M4 12h16M4 18h7" },
];

export default function SiteInfoManager({
  settings,
  navLinks,
  imageHistory,
}: {
  settings: SiteSettings | null;
  navLinks: NavLink[];
  imageHistory?: Record<ImageHistoryField, ImageHistoryEntry[]>;
}) {
  const [tab, setTab] = useState<SiteInfoTab>("brand");

  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      {/* Tab rail — horizontal scroller on mobile, vertical list on desktop */}
      <div
        role="tablist"
        aria-label="Site info sections"
        className="mb-6 flex gap-1.5 overflow-x-auto pb-1 lg:mb-0 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              id={`site-info-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={`site-info-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-semibold transition-colors lg:w-full ${
                active
                  ? "border-caffeine-dark bg-caffeine-dark text-white"
                  : "border-transparent text-stone-600 hover:bg-stone-100"
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
              <span className="whitespace-nowrap">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="min-w-0 flex-1">
        {/* Both forms stay mounted so switching tabs never discards
            half-finished edits; only visibility changes. */}
        <div className={tab === "navigation" ? "hidden" : ""}>
          <SiteInfoForm settings={settings} imageHistory={imageHistory} activeTab={tab} />
        </div>
        <div className={tab === "navigation" ? "" : "hidden"}>
          <NavLinksForm navLinks={navLinks} />
        </div>
      </div>
    </div>
  );
}
