/* Curated theme presets so a non-technical client can pick a good-looking
   combination instead of guessing at hex codes.

   COLOR PALETTES: each preset sets all 6 theme_settings color columns at
   once. Values are still stored as plain hex in the database — presets are
   just a UI convenience for filling the existing color inputs.

   FONT PAIRINGS: unlike colors, fonts can't be arbitrary text. A font only
   renders correctly if its files are actually loaded, and loading an
   arbitrary Google Font at runtime would mean either shipping an API call
   to Google's CDN on every page view (what "without using an API" in the
   brief ruled out) or a full redeploy every time someone wants to pick a
   new one. The fix: bundle a small, curated set of fonts at BUILD time via
   next/font/google (see src/app/layout.tsx), and let the admin pick among
   *those* by key. Every pairing below is one of the fonts already loaded
   there, so switching fonts here takes effect immediately — no redeploy,
   no runtime request to any font API. */

export const COLOR_PALETTES = [
  {
    key: "classic-coffee",
    label: "Classic Coffee",
    swatch: "#1c120c",
    colors: {
      color_dark: "#1c120c",
      color_card: "#291b13",
      color_cream: "#f9f4ee",
      color_tan: "#f0e3d5",
      color_accent: "#432516",
      color_gold: "#d99b26",
    },
  },
  {
    key: "forest-green",
    label: "Forest Green",
    swatch: "#16281f",
    colors: {
      color_dark: "#16281f",
      color_card: "#1f3a2c",
      color_cream: "#f6f3e9",
      color_tan: "#e4e5d3",
      color_accent: "#2f5138",
      color_gold: "#c9a24b",
    },
  },
  {
    key: "charcoal-cream",
    label: "Charcoal & Cream",
    swatch: "#20232a",
    colors: {
      color_dark: "#20232a",
      color_card: "#2d3038",
      color_cream: "#faf9f6",
      color_tan: "#e7e4dd",
      color_accent: "#4a4e58",
      color_gold: "#c9974a",
    },
  },
  {
    key: "rose-gold",
    label: "Rose Gold",
    swatch: "#3a2027",
    colors: {
      color_dark: "#3a2027",
      color_card: "#4d2c34",
      color_cream: "#fdf4f0",
      color_tan: "#f2e1da",
      color_accent: "#7a3f4a",
      color_gold: "#e0a86a",
    },
  },
  {
    key: "ocean-blue",
    label: "Ocean Blue",
    swatch: "#122733",
    colors: {
      color_dark: "#122733",
      color_card: "#1b3a4a",
      color_cream: "#f4f8f9",
      color_tan: "#dfe9ec",
      color_accent: "#2c5870",
      color_gold: "#d4a441",
    },
  },
  {
    key: "warm-sunset",
    label: "Warm Sunset",
    swatch: "#2b1810",
    colors: {
      color_dark: "#2b1810",
      color_card: "#412415",
      color_cream: "#fff3e8",
      color_tan: "#f7ddc2",
      color_accent: "#a4522c",
      color_gold: "#e8a13c",
    },
  },
  {
    key: "lavender-latte",
    label: "Lavender Latte",
    swatch: "#26202f",
    colors: {
      color_dark: "#26202f",
      color_card: "#372e44",
      color_cream: "#f8f5fb",
      color_tan: "#e6ddef",
      color_accent: "#5c4a75",
      color_gold: "#c9a24b",
    },
  },
  {
    key: "midnight-mono",
    label: "Midnight Mono",
    swatch: "#0e0e10",
    colors: {
      color_dark: "#0e0e10",
      color_card: "#1a1a1d",
      color_cream: "#f7f7f5",
      color_tan: "#e3e2df",
      color_accent: "#3a3a3f",
      color_gold: "#cfa64d",
    },
  },
] as const;

export type ColorPaletteKey = (typeof COLOR_PALETTES)[number]["key"];

/* `heading` / `body` reference the CSS variable name each next/font
   instance in layout.tsx was given (its `variable` option) — NOT the raw
   Google Font family name. Writing the raw name into a stylesheet doesn't
   reliably load the self-hosted font next/font generated; referencing the
   variable does, because next/font's own generated CSS ties that variable
   to the correct @font-face it built at compile time. */
export const FONT_PAIRINGS = [
  {
    key: "comfortaa-jakarta",
    label: "Comfortaa + Plus Jakarta Sans",
    description: "Rounded and friendly (default).",
    heading: "--font-cozy",
    body: "--font-body",
    headingFallback: "cursive, sans-serif",
    bodyFallback: "sans-serif",
  },
  {
    key: "playfair-inter",
    label: "Playfair Display + Inter",
    description: "Elegant serif heading, clean modern body.",
    heading: "--font-playfair",
    body: "--font-inter",
    headingFallback: "serif",
    bodyFallback: "sans-serif",
  },
  {
    key: "fraunces-inter",
    label: "Fraunces + Inter",
    description: "Warm, editorial serif with a crisp body font.",
    heading: "--font-fraunces",
    body: "--font-inter",
    headingFallback: "serif",
    bodyFallback: "sans-serif",
  },
  {
    key: "poppins-inter",
    label: "Poppins + Inter",
    description: "Geometric and contemporary.",
    heading: "--font-poppins",
    body: "--font-inter",
    headingFallback: "sans-serif",
    bodyFallback: "sans-serif",
  },
  {
    key: "dmserif-dmsans",
    label: "DM Serif Display + DM Sans",
    description: "Bold classic serif, matched sans body.",
    heading: "--font-dm-serif",
    body: "--font-dm-sans",
    headingFallback: "serif",
    bodyFallback: "sans-serif",
  },
  {
    key: "spacegrotesk-worksans",
    label: "Space Grotesk + Work Sans",
    description: "Techy, distinctive heading with an easy-reading body.",
    heading: "--font-space-grotesk",
    body: "--font-work-sans",
    headingFallback: "sans-serif",
    bodyFallback: "sans-serif",
  },
  {
    key: "cormorant-nunito",
    label: "Cormorant Garamond + Nunito Sans",
    description: "High-contrast literary serif, soft rounded body.",
    heading: "--font-cormorant",
    body: "--font-nunito",
    headingFallback: "serif",
    bodyFallback: "sans-serif",
  },
  {
    key: "quicksand-worksans",
    label: "Quicksand + Work Sans",
    description: "Soft, approachable heading with a tidy body font.",
    heading: "--font-quicksand",
    body: "--font-work-sans",
    headingFallback: "sans-serif",
    bodyFallback: "sans-serif",
  },
] as const;

export type FontPairingKey = (typeof FONT_PAIRINGS)[number]["key"];

export const DEFAULT_FONT_PAIRING: FontPairingKey = "comfortaa-jakarta";

export function findFontPairing(key: string | null | undefined) {
  return FONT_PAIRINGS.find((f) => f.key === key) ?? FONT_PAIRINGS.find((f) => f.key === DEFAULT_FONT_PAIRING)!;
}

export function isFontPairingKey(value: unknown): value is FontPairingKey {
  return typeof value === "string" && FONT_PAIRINGS.some((f) => f.key === value);
}
