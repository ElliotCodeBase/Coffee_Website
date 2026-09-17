-- ============================================================
-- Migration: Security Hardening & Feature Additions
-- Run in Supabase SQL Editor after existing schema.
-- ============================================================

-- ── 1. Add is_main_admin to profiles ────────────────────────────────────
-- Marks exactly one admin as the "Main Admin" who cannot be deleted
-- until the role is explicitly transferred to another admin.
alter table public.profiles
  add column if not exists is_main_admin boolean not null default false;

-- Ensure at most one row can hold is_main_admin = true at any time.
-- (Unique partial index: only one TRUE allowed.)
create unique index if not exists profiles_one_main_admin_idx
  on public.profiles (is_main_admin)
  where (is_main_admin = true);

-- ── 2. Designate the first admin as main admin ───────────────────────────
-- Only runs if nobody has been designated yet. The first admin in the
-- table (by created_at) becomes the initial main admin automatically.
do $$
begin
  if not exists (
    select 1 from public.profiles where is_main_admin = true
  ) then
    update public.profiles
    set is_main_admin = true
    where role = 'admin'
    order by created_at
    limit 1;
  end if;
end;
$$;

-- ── 3. Allow admins/developers to DELETE contact submissions ─────────────
-- The original schema had no DELETE policy on contact_submissions,
-- making it impossible for admins to clean up the inbox.
drop policy if exists "admin delete contact_submissions" on public.contact_submissions;
create policy "admin delete contact_submissions" on public.contact_submissions
  for delete using (public.current_user_role() in ('admin', 'developer'));

-- ── 4. Tighten site_visits RLS: allow staff to read analytics ────────────
-- Staff now has access to the Analytics page per RBAC spec.
drop policy if exists "only admins can view visits" on public.site_visits;
create policy "admin and staff can view visits" on public.site_visits
  for select using (public.current_user_role() in ('admin', 'staff'));

-- ── 5. Ensure profiles RLS lets admins read other admin/staff profiles ───
-- Needed so the Team page can list team members without using service role
-- for every read (service role is still used for the full list, but this
-- lets normal admin sessions at least see their own team in RLS queries).
drop policy if exists "admin read team profiles" on public.profiles;
create policy "admin read team profiles" on public.profiles
  for select using (
    auth.uid() = id
    or public.current_user_role() in ('admin', 'developer')
  );

-- Drop the old, narrower policy if it still exists
drop policy if exists "read own profile" on public.profiles;

-- ── 6. Grant explicit permissions for new migration ──────────────────────
grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;
grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;

-- ============================================================
-- VERIFICATION QUERIES (run manually to confirm):
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name = 'is_main_admin';
-- SELECT id, role, is_main_admin FROM public.profiles;
-- ============================================================
