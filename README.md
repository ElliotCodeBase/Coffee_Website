# Caffeine — Coffee Shop Website

A full-stack, fully-editable website for a coffee shop, built to replace a
static HTML template. Content is managed through a custom admin dashboard —
no code changes needed to update text, images, menu items, or reviews.

## Stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Database:** Supabase Postgres (free tier)
- **Auth:** Supabase Auth (email/password, role-based via `profiles` table)
- **Storage:** Supabase Storage (logo, hero, menu, and review images)
- **Email:** Resend (contact form delivery)
- **Styling:** Tailwind CSS v4
- **Hosting:** Vercel (recommended)

## Project structure

```
src/
  app/
    page.tsx                    Public homepage (server-rendered, DB-driven)
    layout.tsx                  Root layout: fonts, FontAwesome, head code injection
    robots.ts / sitemap.ts      SEO files
    privacy/ terms/             Legal pages (placeholder — replace before launch)
    api/contact/route.ts        Contact form endpoint (validation, email, DB backup)
    admin/
      login/                    Staff login (no sidebar layout)
      (dashboard)/              Shared sidebar layout for everything below
        page.tsx                 Overview / stats
        site-info/                Logo, hero, about, hours, contact, socials, nav
        menu/                     Menu item CRUD
        reviews/                  Review CRUD
        messages/                 Contact form submissions
        developer/                Developer-only subtree (role-gated)
          theme/                   Colors & fonts
          code/                    Custom HTML/CSS/JS injection
          users/                   Staff invites & role management
  components/
    site/                      Public-facing page sections
    admin/                     Admin dashboard UI (forms, managers, sidebar)
  lib/
    supabase/                  Browser/server/admin Supabase clients
    actions/                   Server Actions (mutations) grouped by feature
    data/                      Read-only data-fetching functions
  types/
    database.ts                Hand-written types mirroring the SQL schema
supabase/
  schema.sql                   Full DB schema + Row Level Security policies
  storage-setup.sql            Storage bucket + policies for image uploads
```

## Roles

Two roles exist, enforced by Postgres Row Level Security (not just app code):

- **`admin`** ("Site editor") — can edit all content: site info, menu,
  reviews, and view messages. Cannot touch theme, custom code, or user roles.
- **`developer`** — everything an admin can do, plus theme/colors/fonts,
  raw code injection, and staff user management.

See `SECURITY.md` for how this is enforced at the database level.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your keys — see DEPLOYMENT.md
npm run dev
```

Visit `http://localhost:3000` for the public site, or
`http://localhost:3000/admin/login` for the staff dashboard.

## Documentation

- **`DEPLOYMENT.md`** — step-by-step Supabase + Vercel + domain setup
- **`SECURITY.md`** — what's already hardened, what's a placeholder, and a
  pre-launch checklist

## Original audit

This project replaced a static HTML/Tailwind/vanilla-JS template. The
original template stored all content in `localStorage` (meaning edits
didn't persist across devices), had a hardcoded plaintext admin password
visible in the page source, and used `Tailwind CDN` in production. All of
these are resolved in this rebuild — see `SECURITY.md` for details.
