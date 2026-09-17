-- Run this once against an existing database (Supabase SQL editor) if it
-- predates the image-history feature. New projects created from
-- schema.sql already have this table and do not need to run this file.

create table if not exists public.image_history (
  id uuid primary key default gen_random_uuid(),
  field_name text not null check (field_name in ('logo_url', 'hero_image_url', 'about_image_url')),
  image_url text not null,
  replaced_at timestamptz not null default now()
);

create index if not exists image_history_field_idx on public.image_history (field_name, replaced_at desc);

alter table public.image_history enable row level security;

drop policy if exists "admin manage image_history" on public.image_history;
create policy "admin manage image_history" on public.image_history
  for all using (public.current_user_role() = any (array['admin'::user_role, 'developer'::user_role]));
