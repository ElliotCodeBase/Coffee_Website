# Security Checklist

Status of each item as shipped, plus what you still need to do before going live.

## ✅ Already implemented

- **HTTPS/SSL** — automatic on Vercel and Supabase; nothing to configure.
- **Auth** — Supabase Auth handles password hashing (bcrypt) and session
  tokens (JWT, httpOnly cookies via `@supabase/ssr`). No custom password
  logic in this codebase.
- **Role-based access control** — enforced at three independent layers:
  1. `src/proxy.ts` (middleware) — redirects unauthenticated/wrong-role
     requests before they reach a page.
  2. Layout-level checks (`src/app/admin/(dashboard)/layout.tsx`,
     `.../developer/layout.tsx`) — redirect again server-side.
  3. **Postgres Row Level Security** (`supabase/schema.sql`) — the database
     itself refuses writes from the wrong role, even if the above two layers
     had a bug. This is the most important layer; don't remove it.
- **Input validation** — contact form validated with Zod (`src/app/api/contact/route.ts`)
  before touching the database.
- **Spam protection** — honeypot field (invisible to humans, easy for
  bots to trip) + optional reCAPTCHA v3 score-based verification.
- **Rate limiting** — contact form limited to 5 submissions per IP per
  10 minutes (in-memory; see caveat below).
- **Secrets management** — all API keys/secrets read from environment
  variables (`.env.local` locally, dashboard env vars on Vercel), never
  hardcoded. `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the browser
  (no `NEXT_PUBLIC_` prefix) and is only used in server-only code
  (`createAdminClient()` in `src/lib/supabase/server.ts`).
- **Upload validation** — file type and size checked server-side before
  storage upload (`src/lib/actions/upload.ts`), not just in the browser.
- **No SQL injection surface** — all queries go through the Supabase
  client's parameterized query builder; no raw SQL string concatenation
  anywhere in application code.

## ⚠️ Caveats to know about

- **In-memory rate limiting resets on cold start.** Vercel serverless
  functions don't share memory across instances, so the contact-form rate
  limiter is a soft speed bump, not a hard guarantee. For real protection:
  - Add [Upstash Redis](https://upstash.com) (has a free tier) and swap the
    `Map` in `src/app/api/contact/route.ts` for a Redis-backed limiter, **or**
  - Turn on [Vercel Firewall](https://vercel.com/docs/security/vercel-firewall)
    rules, which rate-limit at the edge before requests even reach your code.
- **Custom code injection (`custom_code_snippets`) has no sandboxing.**
  This is by design — it's meant for things like Google Analytics that need
  full page access — but it means a compromised developer account can inject
  arbitrary JavaScript into the live site. Keep the list of developer-role
  accounts small and use strong, unique passwords for those accounts.
- **Privacy/Terms pages are placeholders.** Replace `/src/app/privacy/page.tsx`
  and `/src/app/terms/page.tsx` with real policies before launch — see the
  in-page notes for generator/lawyer suggestions.

## 🔲 Before you launch — action items

1. **Set all production environment variables** in Vercel (see
   `DEPLOYMENT.md`) — especially `SUPABASE_SERVICE_ROLE_KEY`,
   `RESEND_API_KEY`, and `RECAPTCHA_SECRET_KEY`.
2. **Create your first developer account.** Sign up through Supabase Auth
   (or use the invite flow at `/admin/developer/users` once you have one
   developer bootstrapped), then run this SQL once in the Supabase SQL
   Editor to promote it:
   ```sql
   update public.profiles set role = 'developer' where id = 'YOUR-USER-UUID';
   ```
3. **Rotate any keys** that were ever pasted into chat, committed to git, or
   shared over email/Slack.
4. **Enable Supabase's leaked-password protection** (Authentication →
   Policies in the Supabase dashboard) so users can't set passwords known to
   be in public breach databases.
5. **Set up automated backups.** Supabase free tier does daily backups with
   a limited retention window — confirm this meets your needs, or upgrade
   if you need point-in-time recovery.
6. **Review CORS settings** if you ever expose the Supabase API to another
   domain (not needed for this single-site setup, but worth knowing).
7. **Consider a Web Application Firewall** (Vercel Firewall or Cloudflare)
   for bot/DDoS protection beyond what's built into this codebase.

## Reporting a vulnerability

If you (or a future developer) find a security issue in this codebase,
fix it in a private branch and deploy before disclosing publicly — this is
a small business site, but the same discipline applies at any scale.
