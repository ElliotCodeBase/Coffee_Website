import { getThemeSettings } from "@/lib/data/public";
import { safeColor, safeFont } from "@/lib/theme-sanitize";

export default async function ThemeVars() {
  const theme = await getThemeSettings();
  if (!theme) return null;

  const css = `:root {
    --caffeine-dark: ${safeColor(theme.color_dark, "#1c120c")};
    --caffeine-card: ${safeColor(theme.color_card, "#291b13")};
    --caffeine-cream: ${safeColor(theme.color_cream, "#f9f4ee")};
    --caffeine-tan: ${safeColor(theme.color_tan, "#f0e3d5")};
    --caffeine-accent: ${safeColor(theme.color_accent, "#432516")};
    --caffeine-gold: ${safeColor(theme.color_gold, "#d99b26")};
    --font-cozy: "${safeFont(theme.font_heading, "Comfortaa")}", cursive, sans-serif;
    --font-body: "${safeFont(theme.font_body, "Plus Jakarta Sans")}", sans-serif;
  }`;

  // Every value is validated by safeColor/safeFont above, so nothing in the
  // theme table can close the <style> tag or inject markup, even if a row
  // were written by some path other than updateTheme().
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
