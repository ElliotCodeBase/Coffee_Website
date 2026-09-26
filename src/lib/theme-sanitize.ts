/* Validation for theme values that end up inside a <style> block.
   ThemeVars.tsx writes these into CSS with dangerouslySetInnerHTML, so an
   unchecked value such as `red;}</style><script>…` would escape the
   stylesheet and run on every visitor's page. Validate on WRITE (so bad
   values are rejected with a message) and again on RENDER (so a bad row
   written any other way can never reach the page). */

import { isFontPairingKey, findFontPairing } from "@/lib/theme-presets";

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

export function safeColor(value: unknown, fallback: string): string {
  return isHexColor(value) ? value : fallback;
}

/* Fonts are no longer free text (see src/lib/theme-presets.ts for why) —
   this just confirms the saved key is one of the curated pairings, and
   returns it unchanged so the caller can look up its CSS variables. */
export function safeFontPairingKey(value: unknown): string {
  return isFontPairingKey(value) ? value : findFontPairing(undefined).key;
}
