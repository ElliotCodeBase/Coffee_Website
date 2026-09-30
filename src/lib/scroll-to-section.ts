/* Smooth-scroll for in-page nav links.

   Sections are aligned to the top under the fixed header by default. The
   menu is different: its heading, tabs and first rows are what a visitor
   wants to see, and aligning the section's (very padded) top edge left only
   half of that on screen. Any element marked data-scroll-focus="menu" is
   what gets centered instead; if it is taller than the screen it is aligned
   just under the header. */

export function scrollToSection(href: string): boolean {
  if (!href.startsWith("#") || href === "#") return false;
  const section = document.querySelector<HTMLElement>(href);
  if (!section) return false;

  const focus = document.querySelector<HTMLElement>(`[data-scroll-focus="${href.slice(1)}"]`);
  const header = document.querySelector("header");
  const headerH = header ? header.getBoundingClientRect().height : 0;

  if (!focus) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  const rect = focus.getBoundingClientRect();
  const absTop = rect.top + window.scrollY;
  const room = window.innerHeight - headerH;
  const top = rect.height + 32 <= room ? absTop - headerH - (room - rect.height) / 2 : absTop - headerH - 24;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: Math.max(0, Math.min(top, max)), behavior: "smooth" });
  return true;
}
