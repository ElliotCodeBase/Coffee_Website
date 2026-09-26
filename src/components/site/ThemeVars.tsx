import { getThemeSettings } from "@/lib/data/public";
import { safeColor, safeFontPairingKey } from "@/lib/theme-sanitize";
import { findFontPairing } from "@/lib/theme-presets";

export default async function ThemeVars() {
  const theme = await getThemeSettings();
  if (!theme) return null;

  const pairing = findFontPairing(safeFontPairingKey(theme.font_pairing));

  /* --font-cozy/--font-body are re-pointed at whichever next/font variable
     the chosen pairing uses (e.g. var(--font-playfair)), not a literal font
     name. Every one of those variables is already defined — by the className
     on <html> in layout.tsx — for every curated font, so switching pairings
     here takes effect immediately with no rebuild and no runtime font API
     call: the font files were all self-hosted at build time. */
  const css = `:root {
    --caffeine-dark: ${safeColor(theme.color_dark, "#1c120c")};
    --caffeine-card: ${safeColor(theme.color_card, "#291b13")};
    --caffeine-cream: ${safeColor(theme.color_cream, "#f9f4ee")};
    --caffeine-tan: ${safeColor(theme.color_tan, "#f0e3d5")};
    --caffeine-accent: ${safeColor(theme.color_accent, "#432516")};
    --caffeine-gold: ${safeColor(theme.color_gold, "#d99b26")};
    --font-cozy: var(${pairing.heading}), ${pairing.headingFallback};
    --font-body: var(${pairing.body}), ${pairing.bodyFallback};
  }`;

  // Every value is validated by safeColor/safeFontPairingKey above, so
  // nothing in the theme table can close the <style> tag or inject markup,
  // even if a row were written by some path other than updateTheme().
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
