-- Run this once against an existing database (Supabase SQL editor) if it
-- shows symptoms like: menu items not appearing on the public site,
-- being unable to log in / stay logged in as admin/staff, or team
-- invites failing with "failed to set permissions". All three symptoms
-- have the same root cause: RLS policies only ever *restrict* access
-- that a table-level GRANT already permits — with no GRANT at all, a
-- role is refused before RLS is even evaluated, regardless of how
-- correct the policies themselves are. This affects anon (the public
-- site), authenticated (logged-in users), AND service_role (admin-only
-- server actions that deliberately bypass RLS, like inviting a team
-- member) alike — a schema reset can wipe grants for all three.
--
-- This typically happens after a manual `drop schema public cascade`
-- reset, since that also drops Supabase's normal default privileges,
-- which aren't automatically reapplied unless a fresh project is created
-- through the dashboard.
--
-- New projects created from the current schema.sql already have this
-- and do not need to run this file.

-- SECURITY NOTE: an earlier version of this file granted the PUBLIC anon key
-- full insert/update/delete on every table (and on every future table, via
-- default privileges). RLS contains that today, but one table added later
-- without RLS would be writable by anyone on the internet, and running this
-- file after migration_security_hardening.sql silently undid that hardening.
-- anon now gets exactly what the public site needs and nothing more.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, service_role;

-- anon: read the public content tables only, plus insert a visit row.
-- (Contact messages are written by the server with the service-role key;
-- see migration_lock_contact_inserts.sql.)
grant select on public.site_settings, public.theme_settings, public.nav_links, public.menu_items to anon;
grant insert on public.site_visits to anon;
grant insert on public.contact_submissions to anon; -- remove once migration_lock_contact_inserts.sql is applied
