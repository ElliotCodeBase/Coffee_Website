-- ============================================================
-- Migration: record whether the contact-form notification email was sent
--
-- Run in the Supabase SQL Editor. Safe to re-run.
-- Deploy order does not matter: the app retries the insert without these
-- columns if they don't exist yet, so no message is ever lost.
--
-- NULL      = message predates this migration (delivery unknown)
-- pending   = saved, email not yet attempted / attempt in flight
-- sent      = the email provider accepted the notification
-- failed    = the provider rejected it (see email_error) — the message is
--             still safe in this table and in the admin Messages page
-- skipped   = no recipient address was configured
-- ============================================================
alter table public.contact_submissions
  add column if not exists email_status text
    check (email_status is null or email_status in ('pending', 'sent', 'failed', 'skipped'));

alter table public.contact_submissions
  add column if not exists email_error text;
