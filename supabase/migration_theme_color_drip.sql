-- ============================================================
-- Migration: editable "milk drip" color for the Our Story edge.
-- Run in the Supabase SQL Editor. Safe to re-run.
-- ============================================================
alter table public.theme_settings
  add column if not exists color_drip text default '#fff3e3';

update public.theme_settings set color_drip = '#fff3e3' where color_drip is null;
