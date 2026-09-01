-- ============================================================
-- Migration: add a "staff" role
-- Run this in the Supabase SQL Editor against your project.
--
-- IMPORTANT: run this file in TWO steps, not all at once.
-- Postgres will not let a brand-new enum value be *used* (e.g. in a
-- policy comparison) inside the same transaction that created it.
-- The Supabase SQL editor runs a pasted script as one transaction,
-- so:
--   1. Select and run ONLY the "STEP 1" statement below, then
--   2. Select and run the rest of the file ("STEP 2" onward).
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1 — run this on its own first
-- ------------------------------------------------------------
alter type user_role add value if not exists 'staff';


-- ------------------------------------------------------------
-- STEP 2 — run everything below after STEP 1 has completed
-- ------------------------------------------------------------

-- Staff can see the full menu list in the admin panel (including
-- items currently marked unavailable), same as admin/developer.
drop policy if exists "public read menu_items" on public.menu_items;
create policy "public read menu_items" on public.menu_items
  for select using (is_available = true or public.current_user_role() in ('admin', 'developer', 'staff'));

-- Staff can add, edit, and delete menu items — this is the ONLY
-- table staff accounts are allowed to write to. Every other table's
-- existing "admin, developer" policies are left untouched, so staff
-- is automatically blocked from editing site settings, nav links,
-- reviews, messages, theme, and custom code.
drop policy if exists "admin manage menu_items" on public.menu_items;
create policy "admin manage menu_items" on public.menu_items
  for all using (public.current_user_role() in ('admin', 'developer', 'staff'));
