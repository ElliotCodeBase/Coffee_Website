-- ============================================================
-- Migration: close the direct-insert hole on public tables
--
-- PROBLEM: the public anon key ships in every visitor's browser, and
-- contact_submissions allowed anonymous INSERT with `with check (true)`.
-- Anyone could therefore POST straight to
--   https://<project>.supabase.co/rest/v1/contact_submissions
-- and skip everything /api/contact does (reCAPTCHA, rate limit, length and
-- format validation, the notification email) — flooding the admin inbox
-- with arbitrary content.
--
-- FIX: /api/contact now writes with the service-role key (server-only).
-- This migration removes the public write path and adds size limits.
--
-- !! BEFORE RUNNING: confirm SUPABASE_SERVICE_ROLE_KEY is set in your
-- hosting environment and the site has been redeployed with this version.
-- If it is not set, the contact form will stop saving messages after this
-- runs. Run this only AFTER you have submitted one test message on the
-- live site and seen it appear in Admin → Messages.
--
-- Safe to re-run.
-- ============================================================

-- 1. No public writes to the messages table.
revoke insert on public.contact_submissions from anon;
drop policy if exists "anyone can submit contact form" on public.contact_submissions;

-- 2. Defense in depth: even a privileged writer can't store huge payloads.
--    NOT VALID = enforced for new rows without failing on existing data.
alter table public.contact_submissions drop constraint if exists contact_submissions_size_check;
alter table public.contact_submissions
  add constraint contact_submissions_size_check check (
    char_length(name) <= 200
    and char_length(email) <= 320
    and char_length(message) <= 5000
    and (topic is null or char_length(topic) <= 50)
  ) not valid;

-- 3. site_visits stays anonymously writable (the browser tracker inserts
--    directly), so bound what an abuser can store per row.
alter table public.site_visits drop constraint if exists site_visits_path_len_check;
alter table public.site_visits
  add constraint site_visits_path_len_check check (char_length(path) <= 300) not valid;
