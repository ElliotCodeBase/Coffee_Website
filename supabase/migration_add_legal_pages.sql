-- ============================================================
-- Migration: Terms of Service / Privacy Policy content, editable in
-- Admin → Legal Pages (admin + developer only — NOT staff).
-- Run in the Supabase SQL Editor. Safe to re-run.
-- ============================================================
create table if not exists public.legal_pages (
  slug text primary key check (slug in ('terms', 'privacy')),
  title text not null,
  content text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

insert into public.legal_pages (slug, title, content) values
  ('terms', 'Terms of Service', null),
  ('privacy', 'Privacy Policy', null)
on conflict (slug) do nothing;

alter table public.legal_pages enable row level security;

drop policy if exists "public read legal_pages" on public.legal_pages;
create policy "public read legal_pages" on public.legal_pages
  for select using (true);

drop policy if exists "admin manage legal_pages" on public.legal_pages;
create policy "admin manage legal_pages" on public.legal_pages
  for all using (public.current_user_role() = any (array['admin'::user_role, 'developer'::user_role]))
  with check (public.current_user_role() = any (array['admin'::user_role, 'developer'::user_role]));

grant select on public.legal_pages to anon, authenticated;
grant select, insert, update, delete on public.legal_pages to authenticated, service_role;
