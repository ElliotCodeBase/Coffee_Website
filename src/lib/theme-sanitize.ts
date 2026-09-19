/* Validation for theme values that end up inside a <style> block.
   ThemeVars.tsx writes these into CSS with dangerouslySetInnerHTML, so an
   unchecked value such as `red;}</style><script>…` would escape the
   stylesheet and run on every visitor's page. Validate on WRITE (so bad
   values are rejected with a message) and again on RENDER (so a bad row
   written any other way can never reach the page). */

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const FONT_NAME = /^[A-Za-z0-9][A-Za-z0-9 _-]{0,59}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

export function isFontName(value: unknown): value is string {
  return typeof value === "string" && FONT_NAME.test(value);
}

export function safeColor(value: unknown, fallback: string): string {
  return isHexColor(value) ? value : fallback;
}

export function safeFont(value: unknown, fallback: string): string {
  return isFontName(value) ? value : fallback;
}
