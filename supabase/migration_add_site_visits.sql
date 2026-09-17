-- Run this once against an existing database (Supabase SQL editor) if it
-- predates the visitor analytics feature. New projects created from
-- schema.sql already have this table and do not need to run this file.

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path text not null default '/'
);

create index if not exists site_visits_created_at_idx on public.site_visits (created_at);

alter table public.site_visits enable row level security;

drop policy if exists "anyone can log a visit" on public.site_visits;
create policy "anyone can log a visit" on public.site_visits
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "only admins can view visits" on public.site_visits;
create policy "only admins can view visits" on public.site_visits
  for select using (public.current_user_role() = 'admin');
