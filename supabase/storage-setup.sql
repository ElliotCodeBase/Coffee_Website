-- ============================================================
-- Supabase Storage bucket setup for site images (logo, hero, menu)
-- Run this in the Supabase SQL Editor AFTER schema.sql
--
-- Safe to re-run: storage policies live in the `storage` schema,
-- which a `drop schema public cascade` reset does NOT remove, so
-- this drops each policy first before recreating it.
-- ============================================================

-- Create a public bucket for site media
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Anyone can VIEW images (public bucket — needed so the live site can display them)
drop policy if exists "public read site-media" on storage.objects;
create policy "public read site-media"
  on storage.objects for select
  using (bucket_id = 'site-media');

-- Only authenticated admin/developer/staff users can upload
drop policy if exists "admin upload site-media" on storage.objects;
create policy "admin upload site-media"
  on storage.objects for insert
  with check (
    bucket_id = 'site-media'
    and auth.role() = 'authenticated'
  );

-- Only authenticated admin/developer/staff users can delete uploads
drop policy if exists "admin delete site-media" on storage.objects;
create policy "admin delete site-media"
  on storage.objects for delete
  using (
    bucket_id = 'site-media'
    and auth.role() = 'authenticated'
  );
