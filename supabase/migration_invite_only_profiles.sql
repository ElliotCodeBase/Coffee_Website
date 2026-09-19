-- ============================================================
-- Migration: only invited people get an admin-panel profile   (OPTIONAL — needs your decision)
--
-- PROBLEM: the public anon key is in every visitor's browser. Unless
-- "Allow new users to sign up" is switched OFF in Supabase, anyone can call
--   POST /auth/v1/signup
-- and create an account. The trigger below used to give every such account a
-- `staff` profile, and staff can read every contact-form message (names,
-- emails, IP addresses), read analytics, edit the menu and upload images.
--
-- BEST FIX (no code, do this first): Supabase Dashboard -> Authentication ->
-- Sign In / Providers -> turn OFF "Allow new users to sign up".
-- Invites sent from the admin panel still work with sign-ups off.
--
-- THIS FILE is the second layer: even if sign-ups get switched back on, a
-- self-registered account gets NO profile and therefore no access. The app
-- already handles this: invites create the profile explicitly (upsert), and
-- the middleware + admin layout now reject accounts without a role.
--
-- CHANGES YOUR SETUP: Supabase's dashboard "Add user" no longer auto-creates
-- a profile. To create the first admin/developer, run after adding the user:
--
--   insert into public.profiles (id, role, is_main_admin)
--   select id, 'admin', true from auth.users where email = 'you@example.com'
--   on conflict (id) do update set role = 'admin', is_main_admin = true;
--
-- Deploy the new app code BEFORE running this file. Safe to re-run.
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;

-- Keep the function (harmless, unreferenced) but make it a no-op so it can
-- never be re-attached by accident and hand out roles again.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Review: accounts that exist but have no profile (should be none of yours).
--   select u.id, u.email, u.created_at from auth.users u
--   left join public.profiles p on p.id = u.id where p.id is null;
