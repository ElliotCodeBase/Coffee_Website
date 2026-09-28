import type { ServiceIcon as ServiceIconKey } from "@/types/database";

/* Curated icon set for the "Our Services" grid. Icons are picked from this
   fixed list (not free-text SVG) for the same reason font pairings are
   curated in theme-presets.ts: arbitrary markup from the admin panel would
   be a stored-XSS vector once rendered on the public site. */
const PATHS: Record<ServiceIconKey, string> = {
  coffee:
    "M4 8h13a3 3 0 010 6h-1M4 8v9a2 2 0 002 2h8a2 2 0 002-2V8M4 8V5h11v3M8 3v1.5M11 3v1.5",
  pastry:
    "M3 15c1.5-3 3.5-5 5-9 1.5 4 2 4.5 3.5 6.5C13 10.5 13.5 8 15 6c1.5 3.5 3 5.5 3 9a6 6 0 01-15 0z",
  seat: "M6 19v-3a3 3 0 013-3h6a3 3 0 013 3v3M4 19h16M6 13V8a2 2 0 012-2h8a2 2 0 012 2v5",
  award:
    "M12 15a5 5 0 100-10 5 5 0 000 10zM8.5 14l-2 7 5.5-3 5.5 3-2-7",
  leaf: "M4 20c8 0 14-6 14-14 0-1 0-2-.2-3C10.5 3.5 4 9.5 4 17c0 1 0 2 .2 3zm0 0c3-3 6-5 10-6",
  wifi: "M5 12.5a11 11 0 0114 0M8 16a6.5 6.5 0 018 0M12 19.5h.01",
};

export const SERVICE_ICON_OPTIONS: { key: ServiceIconKey; label: string }[] = [
  { key: "coffee", label: "☕ Coffee cup" },
  { key: "pastry", label: "🥐 Pastry" },
  { key: "seat", label: "🛋️ Seating" },
  { key: "award", label: "🏅 Award / rewards" },
  { key: "leaf", label: "🌿 Leaf / organic" },
  { key: "wifi", label: "📶 Wi-Fi" },
];

export default function ServiceIcon({ icon, className = "w-6 h-6" }: { icon: ServiceIconKey; className?: string }) {
  const d = PATHS[icon] || PATHS.coffee;
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
    </svg>
  );
}
