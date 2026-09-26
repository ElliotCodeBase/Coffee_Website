-- ============================================================
-- Migration: replace free-text font_heading/font_body columns with a
-- single curated font_pairing key (see src/lib/theme-presets.ts for why
-- free text never reliably rendered a real font).
-- Run in the Supabase SQL Editor. Safe to re-run.
-- ============================================================
alter table public.theme_settings
  add column if not exists font_pairing text not null default 'comfortaa-jakarta';

update public.theme_settings set font_pairing = 'comfortaa-jakarta' where font_pairing is null;

alter table public.theme_settings drop column if exists font_heading;
alter table public.theme_settings drop column if exists font_body;
