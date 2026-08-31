-- Run this once against an existing database (Supabase SQL editor) if your
-- site_settings table was created before the "Our Story" background image
-- field existed. New projects created from schema.sql already have this
-- column and do not need to run this file.

alter table public.site_settings
  add column if not exists about_image_url text;
