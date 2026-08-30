"use client";

import { useState, useTransition } from "react";
import type { NavLink } from "@/types/database";
import { updateNavLinks } from "@/lib/actions/site-settings";

export default function NavLinksForm({ navLinks }: { navLinks: NavLink[] }) {
  const [links, setLinks] = useState(navLinks.map((l) => ({ id: l.id, label: l.label, href: l.href })));
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  function updateField(id: string, field: "label" | "href", value: string) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  function handleSave() {
    setStatus("idle");
    startTransition(async () => {
      const result = await updateNavLinks(links);
      setStatus(result.error ? "error" : "success");
    });
  }

  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-5">
      <h2 className="font-cozy font-bold text-lg text-caffeine-dark">Navigation Menu</h2>
      <p className="text-xs text-stone-400 -mt-3">Rename menu items or point them to a different section anchor.</p>

      <div className="space-y-3">
        {links.map((link) => (
          <div key={link.id} className="grid grid-cols-2 gap-3">
            <input
              value={link.label}
              onChange={(e) => updateField(link.id, "label", e.target.value)}
              className="px-4 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
              placeholder="Label"
            />
            <input
              value={link.href}
              onChange={(e) => updateField(link.id, "href", e.target.value)}
              className="px-4 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none font-mono"
              placeholder="#section-id"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="bg-caffeine-dark hover:bg-caffeine-card disabled:opacity-60 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors active:scale-95"
        >
          {isPending ? "Saving…" : "Save navigation"}
        </button>
        {status === "success" && <span className="text-sm font-semibold text-green-700">Saved!</span>}
        {status === "error" && <span className="text-sm font-semibold text-red-600">Failed to save.</span>}
      </div>
    </div>
  );
}
