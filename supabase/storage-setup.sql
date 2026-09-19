-- ============================================================
-- Supabase Storage bucket setup for site images (logo, hero, menu)
-- Run this in the Supabase SQL Editor AFTER schema.sql.
--
-- Safe to re-run: storage policies live in the `storage` schema, which a
-- `drop schema public cascade` reset does NOT remove, so this drops each
-- policy first before recreating it.
-- ============================================================

-- Create a public bucket for site media.
--
-- NOTE: image/svg+xml is deliberately absent. This bucket is public, so an
-- uploaded SVG is served from the Supabase storage origin as
-- image/svg+xml — and SVG can carry <script> and inline event handlers.
-- Allowing it lets anyone with upload rights (including a staff account)
-- hand out a link that executes script on that origin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set allowed_mime_types = excluded.allowed_mime_types,
    file_size_limit = excluded.file_size_limit,
    public = excluded.public;

-- Anyone can VIEW images (public bucket — needed so the live site can display them)
drop policy if exists "public read site-media" on storage.objects;
create policy "public read site-media"
  on storage.objects for select
  using (bucket_id = 'site-media');

-- Writes are limited to real panel roles.
-- Previously these checked only `auth.role() = 'authenticated'`, which is
-- true for ANY signed-in Supabase user — including one created through a
-- public signup — not just members of the admin panel.
drop policy if exists "admin upload site-media" on storage.objects;
create policy "admin upload site-media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and public.current_user_role() in ('admin', 'developer', 'staff')
  );

drop policy if exists "admin update site-media" on storage.objects;
create policy "admin update site-media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'site-media'
    and public.current_user_role() in ('admin', 'developer', 'staff')
  );

drop policy if exists "admin delete site-media" on storage.objects;
create policy "admin delete site-media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'site-media'
    and public.current_user_role() in ('admin', 'developer', 'staff')
  );
