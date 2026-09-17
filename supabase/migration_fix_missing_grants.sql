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

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
