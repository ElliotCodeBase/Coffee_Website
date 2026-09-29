/* Loading-animation options. They live on theme_settings (Admin -> Theme &
   Colors -> Loading animation) and are read on every page load, so every
   value is validated/clamped here whether it came from the admin form or
   straight from the database. Missing columns (migration not run yet)
   simply mean "use the defaults". */

import type { ThemeSettings } from "@/types/database";

export const LOADER_MIN_MS = 800;
export const LOADER_MAX_MS = 6000;
export const LOADER_LABEL_MAX = 40;
export const LOADER_FREQUENCIES = ["every", "session"] as const;
export type LoaderFrequency = (typeof LOADER_FREQUENCIES)[number];

export type LoaderConfig = {
  enabled: boolean;
  durationMs: number;
  frequency: LoaderFrequency;
  showPercent: boolean;
  /** Small caption above the percentage; empty = none. */
  label: string;
};

export const DEFAULT_LOADER: LoaderConfig = {
  enabled: true,
  durationMs: 2400,
  frequency: "every",
  showPercent: true,
  label: "",
};

export function clampDuration(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return DEFAULT_LOADER.durationMs;
  return Math.min(LOADER_MAX_MS, Math.max(LOADER_MIN_MS, Math.round(v)));
}

export function isLoaderFrequency(v: unknown): v is LoaderFrequency {
  return typeof v === "string" && (LOADER_FREQUENCIES as readonly string[]).includes(v);
}

export function cleanLabel(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, LOADER_LABEL_MAX);
}

export function loaderConfigFrom(theme: Partial<ThemeSettings> | null | undefined, fallbackLabel = ""): LoaderConfig {
  if (!theme) return { ...DEFAULT_LOADER, label: fallbackLabel };
  return {
    enabled: theme.loader_enabled ?? DEFAULT_LOADER.enabled,
    durationMs: clampDuration(theme.loader_duration_ms ?? DEFAULT_LOADER.durationMs),
    frequency: isLoaderFrequency(theme.loader_frequency) ? theme.loader_frequency : DEFAULT_LOADER.frequency,
    showPercent: theme.loader_show_percent ?? DEFAULT_LOADER.showPercent,
    label: cleanLabel(theme.loader_label) || cleanLabel(fallbackLabel),
  };
}
