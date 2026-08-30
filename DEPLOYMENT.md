# Deployment Guide

Everything needed to take this from local code to a live site, using the
free tiers of Supabase (database/auth/storage) and Vercel (hosting).

---

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. In the SQL Editor, run **`supabase/schema.sql`** — this creates all
   tables, RLS policies, and seed data.
3. Then run **`supabase/storage-setup.sql`** — this creates the `site-media`
   storage bucket for logo/hero/menu/review images.
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`
     (⚠️ never expose this one to the browser or commit it to git)
5. Go to **Authentication → Providers** and confirm **Email** is enabled
   (it is by default).
6. (Recommended) Under **Authentication → Policies**, turn on
   **leaked password protection**.

### Creating your first admin/developer account

The sign-up form isn't public-facing (there's no public "Sign Up" page —
staff access is invite-only). To create your first account:

1. In the Supabase dashboard: **Authentication → Users → Add user** →
   enter an email + password (or use "send invite" to email a signup link).
2. A `profiles` row is auto-created for them with `role = 'admin'` (via a
   database trigger — see `handle_new_user()` in `schema.sql`).
3. To make them a **developer** (full access), run in the SQL Editor:
   ```sql
   update public.profiles set role = 'developer' where id = 'THEIR-USER-UUID';
   ```
   (Find the UUID in **Authentication → Users**.)
4. From then on, that developer can invite further staff from
   `/admin/developer/users` in the app itself.

---

## 2. Resend setup (contact form emails)

1. Create a free account at [resend.com](https://resend.com) (3,000
   emails/month free).
2. Verify a sending domain, **or** for quick testing use their default
   `onboarding@resend.dev` sender (works immediately, no domain needed,
   but looks less professional to recipients).
3. Create an API key → `RESEND_API_KEY`.
4. Set `CONTACT_FORM_TO_EMAIL` to the address that should receive
   submissions, and `CONTACT_FORM_FROM_EMAIL` to your verified sender.

---

## 3. reCAPTCHA setup (optional but recommended)

1. Go to [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin).
2. Register a new site, choose **reCAPTCHA v3**, add your domain.
3. Copy the **Site Key** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.
4. Copy the **Secret Key** → `RECAPTCHA_SECRET_KEY`.

If you skip this, the contact form still works — it just relies on the
honeypot field and rate limiting alone.

---

## 4. Deploy to Vercel

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Vercel auto-detects Next.js — no build config changes needed.
4. Under **Environment Variables**, add everything from `.env.example`:

   | Variable | Where to get it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
   | `RESEND_API_KEY` | Resend → API Keys |
   | `CONTACT_FORM_TO_EMAIL` | Your business email |
   | `CONTACT_FORM_FROM_EMAIL` | Your verified Resend sender |
   | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA admin |
   | `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA admin |
   | `NEXT_PUBLIC_SITE_URL` | Your production domain, e.g. `https://caffeinecoffee.com` |

5. Click **Deploy**.

---

## 5. Domain & DNS

1. In Vercel: **Project → Settings → Domains** → add your domain
   (e.g. `caffeinecoffee.com`).
2. Vercel shows you the DNS records to add. At your domain registrar
   (GoDaddy, Namecheap, Google Domains, etc.):
   - For an apex domain (`caffeinecoffee.com`): add the **A record**
     Vercel provides.
   - For `www.caffeinecoffee.com`: add the **CNAME record** Vercel provides.
3. DNS propagation can take a few minutes to a few hours. Vercel
   auto-provisions an SSL certificate once DNS resolves — no manual
   SSL setup needed.
4. Update `NEXT_PUBLIC_SITE_URL` in Vercel's env vars to match your final
   domain, then redeploy (this affects sitemap/metadata URLs).

---

## 6. Pre-launch checklist

- [ ] Replace all seed/placeholder content via the admin dashboard
      (logo, hero image, about text, menu items, reviews, hours, contact info)
- [ ] Replace `/privacy` and `/terms` placeholder pages with real policies
- [ ] Test the contact form end-to-end (submit → check inbox → check
      `/admin/messages`)
- [ ] Test on a real mobile device (not just browser resize) — check the
      nav menu, contact form, and image loading
- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev) against your
      live URL and address any red flags
- [ ] Confirm favicon renders correctly in a browser tab (replace
      `src/app/favicon.ico` with your own if desired)
- [ ] Check all internal links work (nav anchors scroll to the right
      section, footer links go to real pages)
- [ ] Verify `/sitemap.xml` and `/robots.txt` render correctly on your
      live domain
- [ ] Add Google Analytics or another tracking snippet via
      `/admin/developer/code` if desired
- [ ] Submit your sitemap to [Google Search Console](https://search.google.com/search-console)
- [ ] Read through `SECURITY.md` and complete its launch checklist
- [ ] Confirm you can log in as both an `admin` and a `developer` account
      and that each sees the right nav items

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase/Resend/reCAPTCHA keys
npm run dev                  # http://localhost:3000
```

To apply schema changes locally, run the same SQL files against your
Supabase project (there's no separate local Postgres in this setup — dev
and prod share the schema, just point `.env.local` at a dev Supabase
project if you want full separation).
