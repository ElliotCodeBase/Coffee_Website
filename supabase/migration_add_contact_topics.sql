-- ============================================================
-- Migration: contact_topics table — the editable "What is this about?"
-- dropdown options on the contact form (Admin → Site Info → Contact).
-- Also documents the theme_settings RLS fix applied the same session.
-- Run in the Supabase SQL Editor. Safe to re-run.
-- ============================================================
create table if not exists public.contact_topics (
  id text primary key,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.contact_topics (id, label, sort_order) values
  ('general', 'General Question', 0),
  ('catering', 'Private Events & Catering', 1),
  ('beans', 'Wholesale Coffee Beans', 2),
  ('feedback', 'Feedback', 3)
on conflict (id) do nothing;

alter table public.contact_topics enable row level security;

drop policy if exists "public read contact_topics" on public.contact_topics;
create policy "public read contact_topics" on public.contact_topics
  for select using (true);

drop policy if exists "admin manage contact_topics" on public.contact_topics;
create policy "admin manage contact_topics" on public.contact_topics
  for all using (public.current_user_role() = any (array['admin'::user_role, 'developer'::user_role]))
  with check (public.current_user_role() = any (array['admin'::user_role, 'developer'::user_role]));

grant select on public.contact_topics to anon, authenticated;
grant select, insert, update, delete on public.contact_topics to authenticated, service_role;

-- ------------------------------------------------------------
-- Fix: theme_settings had RLS enabled with NO policies at all, so every
-- read and write was silently blocked for the app's normal client (only
-- service_role bypassed it). This is why saved colors/fonts never showed
-- up on the public site.
-- ------------------------------------------------------------
drop policy if exists "public read theme_settings" on public.theme_settings;
create policy "public read theme_settings" on public.theme_settings
  for select using (true);

drop policy if exists "admin manage theme_settings" on public.theme_settings;
create policy "admin manage theme_settings" on public.theme_settings
  for all using (public.current_user_role() = any (array['admin'::user_role, 'developer'::user_role]))
  with check (public.current_user_role() = any (array['admin'::user_role, 'developer'::user_role]));
