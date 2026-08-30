import { getThemeSettings } from "@/lib/data/public";

export default async function ThemeVars() {
  const theme = await getThemeSettings();
  if (!theme) return null;

  const css = `:root {
    --caffeine-dark: ${theme.color_dark};
    --caffeine-card: ${theme.color_card};
    --caffeine-cream: ${theme.color_cream};
    --caffeine-tan: ${theme.color_tan};
    --caffeine-accent: ${theme.color_accent};
    --caffeine-gold: ${theme.color_gold};
    --font-cozy: "${theme.font_heading}", cursive, sans-serif;
    --font-body: "${theme.font_body}", sans-serif;
  }`;

  // Safe: values come from a DB table only the "developer" role can write
  // (enforced by Row Level Security), never from user-submitted input.
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
