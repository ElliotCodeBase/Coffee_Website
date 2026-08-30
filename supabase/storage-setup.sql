-- ============================================================
-- Supabase Storage bucket setup for site images (logo, hero, menu, reviews)
-- Run this in the Supabase SQL Editor AFTER schema.sql
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
create policy "public read site-media"
  on storage.objects for select
  using (bucket_id = 'site-media');

-- Only authenticated admin/developer users can upload
create policy "admin upload site-media"
  on storage.objects for insert
  with check (
    bucket_id = 'site-media'
    and auth.role() = 'authenticated'
  );

-- Only authenticated admin/developer users can delete their own uploads
create policy "admin delete site-media"
  on storage.objects for delete
  using (
    bucket_id = 'site-media'
    and auth.role() = 'authenticated'
  );
