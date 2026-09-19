# Caffeine — Coffee Shop Website

A full-stack website for a coffee shop. Staff manage all content through an admin dashboard. No code changes are needed to update text, images, menu items, or reviews.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Database | Supabase Postgres (free tier) |
| Auth | Supabase Auth (email and password, role-based via `profiles` table) |
| Storage | Supabase Storage (logo, hero, menu, and review images) |
| Email | Resend (contact form delivery) |
| Styling | Tailwind CSS v4 |
| Hosting | Vercel (recommended) |

## Project Structure

```
src/
  app/
    page.tsx                    Public home page (server-rendered, database-driven)
    layout.tsx                  Root layout: fonts, FontAwesome, head code injection
    robots.ts / sitemap.ts      SEO files
    privacy/ terms/             Legal pages (replace before launch)
    api/contact/route.ts        Contact form endpoint (validation, email, database backup)
    admin/
      login/                    Staff login page (no sidebar)
      (dashboard)/              Shared sidebar layout for all pages below
        page.tsx                 Overview and stats
        site-info/               Logo, hero, about, hours, contact, socials, nav
        menu/                    Menu item management
        reviews/                 Review management
        messages/                Contact form submissions
        developer/               Developer-only section (role-gated)
          theme/                  Colors and fonts
          code/                   Custom HTML, CSS, and JS injection
          users/                  Staff invites and role management
  components/
    site/                      Public page sections
    admin/                     Admin dashboard UI (forms, managers, sidebar)
  lib/
    supabase/                  Browser, server, and admin Supabase clients
    actions/                   Server Actions (mutations) grouped by feature
    data/                      Read-only data-fetching functions
  types/
    database.ts                Types that match the SQL schema
supabase/
  schema.sql                   Full database schema and Row Level Security policies
  storage-setup.sql            Storage bucket and policies for image uploads
```

## Roles

Two roles exist. Postgres Row Level Security enforces them at the database level.

| Role | Permissions |
|---|---|
| `admin` | Edit site info, menu, reviews, and messages. Cannot change theme, custom code, or user roles. |
| `developer` | All admin permissions, plus theme, custom code injection, and user management. |

See `SECURITY.md` for how the database enforces these roles.

## Get Started

```bash
npm install
cp .env.example .env.local   # Fill in your keys. See DEPLOYMENT.md.
npm run dev
```

- Public site: `http://localhost:3000`
- Admin dashboard: `http://localhost:3000/admin/login`

## Documentation

- `DEPLOYMENT.md` — Step-by-step setup for Supabase, Vercel, and your domain.
- `SECURITY.md` — What is already hardened, what is a placeholder, and a pre-launch checklist.
