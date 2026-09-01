-- ============================================================
-- Migration: menu "Best Seller" / "New" flags, staff read-only
-- access to contact messages.
-- Run this in the Supabase SQL Editor. Safe to run as one script —
-- unlike the staff-role migration, nothing here needs to be split
-- into separate steps.
-- ============================================================

-- ------------------------------------------------------------
-- Menu items: Best Seller / New flags
-- ------------------------------------------------------------
alter table public.menu_items add column if not exists is_best_seller boolean not null default false;
alter table public.menu_items add column if not exists is_new boolean not null default false;

-- ------------------------------------------------------------
-- Contact submissions: staff can VIEW messages, but cannot change
-- their status (mark read/archived stays admin + developer only —
-- see the existing "admin update contact_submissions" policy,
-- which is intentionally left untouched).
-- ------------------------------------------------------------
drop policy if exists "admin read contact_submissions" on public.contact_submissions;
create policy "admin read contact_submissions" on public.contact_submissions
  for select using (public.current_user_role() in ('admin', 'developer', 'staff'));
