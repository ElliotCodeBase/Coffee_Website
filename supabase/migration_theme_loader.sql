-- ============================================================
-- Migration: editable "loading animation" (Admin -> Theme & Colors).
-- Run in the Supabase SQL Editor. Safe to re-run.
-- Until this is run the site still shows the loader with its defaults;
-- only saving the loader options from the admin needs these columns.
-- ============================================================
alter table public.theme_settings
  add column if not exists loader_enabled boolean default true,
  add column if not exists loader_duration_ms int default 2400,
  add column if not exists loader_frequency text default 'every',
  add column if not exists loader_show_percent boolean default true,
  add column if not exists loader_label text;

update public.theme_settings set loader_enabled = true where loader_enabled is null;
update public.theme_settings set loader_duration_ms = 2400 where loader_duration_ms is null;
update public.theme_settings set loader_frequency = 'every' where loader_frequency is null;
update public.theme_settings set loader_show_percent = true where loader_show_percent is null;
