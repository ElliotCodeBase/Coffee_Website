-- ============================================================
-- Migration: Security Hardening v2
-- Run in Supabase SQL Editor after schema.sql. Idempotent.
--
-- This REPLACES the earlier version of this file, which could never
-- run: it used `UPDATE ... ORDER BY ... LIMIT 1`, which is invalid in
-- PostgreSQL. Because the SQL Editor runs a script in one transaction,
-- that syntax error rolled the ENTIRE migration back — which is why
-- `is_main_admin` never existed, the Team page failed, staff were
-- bounced off Analytics, and message deletion had no policy.
-- ============================================================

-- ── 1. is_main_admin ────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_main_admin boolean not null default false;

-- At most one row may hold is_main_admin = true.
create unique index if not exists profiles_one_main_admin_idx
  on public.profiles (is_main_admin)
  where (is_main_admin = true);

-- ── 2. Designate the earliest admin as Main Admin ───────────────────────
-- (Valid rewrite of the broken UPDATE ... ORDER BY ... LIMIT.)
update public.profiles
set is_main_admin = true
where id = (
  select id from public.profiles
  where role = 'admin'
  order by created_at
  limit 1
)
and not exists (select 1 from public.profiles where is_main_admin = true);

-- ── 3. Harden the SECURITY DEFINER functions ────────────────────────────
-- Both ran with a mutable search_path (Supabase linter 0011): a caller who
-- can set search_path could shadow `profiles` and make the function read
-- from a table they control. Both were also exposed as callable RPCs to
-- anon and authenticated (linters 0028 / 0029).
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public, anon, authenticated;
grant execute on function public.current_user_role() to authenticated, service_role;

-- PRIVILEGE ESCALATION FIX.
-- The previous trigger hard-coded role 'admin' for every new auth user.
-- Any successful call to /auth/v1/signup with the PUBLIC anon key
-- therefore minted a full site administrator. New users now default to
-- the least-privileged role; both invite flows (addTeamMember and
-- inviteUser) set the intended role immediately afterwards using the
-- service role key, so nothing else changes.
--
-- Also: make this exception-safe. If the insert ever raised, the whole
-- auth.users INSERT was aborted and account creation failed outright.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'staff')
  on conflict (id) do nothing;
  return new;
exception
  when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Backfill any auth user that ended up without a profile row.
insert into public.profiles (id, full_name, role)
select u.id, u.raw_user_meta_data->>'full_name', 'staff'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ── 4. contact_submissions ──────────────────────────────────────────────
-- There was no DELETE policy at all, so admins could not clear the inbox.
drop policy if exists "admin delete contact_submissions" on public.contact_submissions;
create policy "admin delete contact_submissions" on public.contact_submissions
  for delete to authenticated
  using (public.current_user_role() in ('admin', 'developer'));

-- Staff are documented as able to mark messages read / archived / restored,
-- but the UPDATE policy excluded them, so every staff status change failed
-- silently.
drop policy if exists "admin update contact_submissions" on public.contact_submissions;
create policy "admin update contact_submissions" on public.contact_submissions
  for update to authenticated
  using (public.current_user_role() in ('admin', 'developer', 'staff'))
  with check (public.current_user_role() in ('admin', 'developer', 'staff'));

-- ── 5. site_visits: staff can read analytics ────────────────────────────
drop policy if exists "only admins can view visits" on public.site_visits;
drop policy if exists "admin and staff can view visits" on public.site_visits;
create policy "admin and staff can view visits" on public.site_visits
  for select to authenticated
  using (public.current_user_role() in ('admin', 'staff', 'developer'));

-- ── 6. profiles: self + admin/developer can read the team ───────────────
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "admin read team profiles" on public.profiles;
create policy "admin read team profiles" on public.profiles
  for select to authenticated
  using (
    auth.uid() = id
    or public.current_user_role() in ('admin', 'developer')
  );

-- ── 7. Least-privilege grants ───────────────────────────────────────────
-- The previous version of this file ran:
--   grant select, insert, update, delete on all tables in schema public
--     to anon, authenticated, service_role;
-- That hands the PUBLIC anon key full DML on every current and future
-- table in the schema. RLS contains it today, but a single table added
-- later without RLS enabled is then wide open to the internet, and the
-- ALTER DEFAULT PRIVILEGES in schema.sql makes that the default state.
--
-- anon needs exactly: read the public content tables, and insert a contact
-- submission or a visit row. Nothing else.
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke select on
  public.profiles,
  public.contact_submissions,
  public.image_history,
  public.site_visits
from anon;

grant insert on public.contact_submissions to anon;
grant insert on public.site_visits to anon;

alter default privileges in schema public
  revoke insert, update, delete on tables from anon;

grant select, insert, update, delete on all tables in schema public
  to authenticated, service_role;
grant usage, select on all sequences in schema public
  to authenticated, service_role;

-- ============================================================
-- VERIFICATION
-- select column_name from information_schema.columns
--   where table_name = 'profiles' and column_name = 'is_main_admin';
-- select id, role, is_main_admin from public.profiles;
-- select proname, proconfig from pg_proc
--   where proname in ('current_user_role','handle_new_user');
-- select grantee, privilege_type from information_schema.role_table_grants
--   where table_schema='public' and grantee='anon' order by table_name;
-- ============================================================
