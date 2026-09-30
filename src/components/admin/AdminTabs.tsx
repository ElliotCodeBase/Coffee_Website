"use client";

import { useState, type ReactNode } from "react";

/* Simple tabs for admin pages with several unrelated forms. Every panel stays
   mounted (just hidden), so switching tabs never throws away typing. */
export type AdminTab = { key: string; label: string; hint?: string; content: ReactNode };

export default function AdminTabs({ tabs, initial }: { tabs: AdminTab[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.key);
  return (
    <div>
      <div role="tablist" aria-label="Sections" className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={active === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => setActive(t.key)}
            className={`min-w-fit flex-1 rounded-lg px-4 py-2.5 text-left transition-colors ${
              active === t.key ? "bg-caffeine-dark text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <span className="block text-sm font-bold">{t.label}</span>
            {t.hint && <span className={`block text-[11px] ${active === t.key ? "text-white/70" : "text-stone-400"}`}>{t.hint}</span>}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.key} role="tabpanel" id={`panel-${t.key}`} aria-labelledby={`tab-${t.key}`} hidden={active !== t.key}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
