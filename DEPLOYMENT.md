# Deployment Guide

Use this guide to deploy the project. The guide uses the free tiers of Supabase (database, auth, and storage) and Vercel (hosting).

---

## 1. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. Open the SQL Editor. Run `supabase/schema.sql`. This creates all tables, Row Level Security policies, and seed data.
3. Run `supabase/storage-setup.sql`. This creates the `site-media` storage bucket for images.
4. Go to **Project Settings → API**. Copy these values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`
   
   > **Warning:** Never expose `SUPABASE_SERVICE_ROLE_KEY` in the browser or commit it to version control.

5. Go to **Authentication → Providers**. Confirm that **Email** is enabled.
6. (Recommended) Go to **Authentication → Policies**. Enable **Leaked Password Protection**.

### Create the First Admin or Developer Account

The public site has no sign-up page. Staff access is invite-only. Follow these steps to create the first account.

1. In the Supabase dashboard, go to **Authentication → Users → Add user**. Enter an email address and password, or use **Send invite** to email a sign-up link.
2. The database trigger `handle_new_user()` automatically creates a `profiles` row for the new user with `role = 'staff'`.
3. To give the user the `developer` role (full access), run this SQL in the SQL Editor:
   ```sql
   UPDATE public.profiles SET role = 'developer' WHERE id = 'THEIR-USER-UUID';
   ```
   Find the UUID in **Authentication → Users**.
4. After you have one developer account, that person can invite more staff from `/admin/developer/users` in the app.

---

## 2. Set Up Resend (Contact Form Emails)

1. Create a free account at [resend.com](https://resend.com). The free tier allows 3,000 emails per month.
2. Verify a sending domain. For quick testing, use the default `onboarding@resend.dev` sender. This works immediately but looks less professional to recipients.
3. Create an API key. Copy it to `RESEND_API_KEY`.
4. Set `CONTACT_FORM_TO_EMAIL` to the address that receives form submissions.
5. Set `CONTACT_FORM_FROM_EMAIL` to your verified sender address.

---

## 3. Set Up reCAPTCHA (Optional)

reCAPTCHA adds bot protection to the contact form. If you skip this step, the form still works. It uses a honeypot field and rate limiting only.

1. Go to [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin).
2. Register a new site. Select **reCAPTCHA v3**. Add your domain.
3. Copy the **Site Key** to `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`.
4. Copy the **Secret Key** to `RECAPTCHA_SECRET_KEY`.

---

## 4. Deploy to Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new). Import the repository. Vercel detects Next.js automatically. No build configuration changes are needed.
3. Add the following environment variables in Vercel:

   | Variable | Where to Get It |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
   | `RESEND_API_KEY` | Resend → API Keys |
   | `CONTACT_FORM_TO_EMAIL` | Your business email address |
   | `CONTACT_FORM_FROM_EMAIL` | Your verified Resend sender address |
   | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA admin |
   | `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA admin |
   | `NEXT_PUBLIC_SITE_URL` | Your production domain, for example `https://caffeinecoffee.com` |

4. Click **Deploy**.

---

## 5. Configure Your Domain

1. In Vercel, go to **Project → Settings → Domains**. Add your domain, for example `caffeinecoffee.com`.
2. Vercel shows the DNS records to add. At your domain registrar (GoDaddy, Namecheap, Google Domains, or similar):
   - For an apex domain (`caffeinecoffee.com`): Add the **A record** that Vercel provides.
   - For `www.caffeinecoffee.com`: Add the **CNAME record** that Vercel provides.
3. DNS propagation takes a few minutes to a few hours. Vercel provisions an SSL certificate automatically after DNS resolves.
4. Update `NEXT_PUBLIC_SITE_URL` in Vercel to match your final domain. Then redeploy. This variable affects sitemap and metadata URLs.

---

## 6. Pre-Launch Checklist

Complete these steps before the site goes live.

- [ ] Replace all placeholder content using the admin dashboard. Update the logo, hero image, about text, menu items, reviews, hours, and contact information.
- [ ] Replace `/privacy` and `/terms` with real legal policies.
- [ ] Test the contact form end to end. Submit a message. Check your inbox. Check `/admin/messages`.
- [ ] Test on a real mobile device. Check the navigation menu, contact form, and image loading.
- [ ] Run [PageSpeed Insights](https://pagespeed.web.dev) against your live URL. Fix any critical issues.
- [ ] Confirm the favicon appears correctly in a browser tab. Replace `src/app/favicon.ico` with your own if needed.
- [ ] Check that all navigation links scroll to the correct section. Check that footer links go to real pages.
- [ ] Confirm `/sitemap.xml` and `/robots.txt` work on your live domain.
- [ ] Add analytics using `/admin/developer/code` if needed.
- [ ] Submit your sitemap to [Google Search Console](https://search.google.com/search-console).
- [ ] Read `SECURITY.md` and complete its launch checklist.
- [ ] Confirm you can log in as both an `admin` and a `developer` account. Verify that each role sees the correct navigation items.

---

## Local Development

```bash
npm install
cp .env.example .env.local   # Fill in your Supabase, Resend, and reCAPTCHA keys.
npm run dev                  # http://localhost:3000
```

To apply schema changes, run the SQL files against your Supabase project. There is no separate local Postgres in this setup. Development and production share the schema. To separate them, point `.env.local` at a dedicated development Supabase project.
