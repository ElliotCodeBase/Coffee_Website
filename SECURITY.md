# Security Checklist

This document lists what is already implemented and what you must do before the site goes live.

---

## Already Implemented

**HTTPS and SSL**
Vercel and Supabase provide HTTPS automatically. No configuration is needed.

**Authentication**
Supabase Auth handles password hashing (bcrypt) and session tokens (JWT, httpOnly cookies via `@supabase/ssr`). This codebase contains no custom password logic.

**Role-Based Access Control**
Three independent layers enforce access control:

1. `src/proxy.ts` (middleware) — Redirects unauthenticated requests and requests from the wrong role before they reach a page.
2. Layout-level checks (`src/app/admin/(dashboard)/layout.tsx` and `.../developer/layout.tsx`) — Redirect again on the server side.
3. **Postgres Row Level Security** (`supabase/schema.sql`) — The database rejects writes from the wrong role, even if both layers above have a bug. This is the most important layer. Do not remove it.

**Input Validation**
The contact form is validated with Zod in `src/app/api/contact/route.ts` before any database write.

**Spam Protection**
A honeypot field (invisible to humans, visible to bots) blocks automated submissions. reCAPTCHA v3 score verification is optional.

**Rate Limiting**
The contact form allows 5 submissions per IP address per 10 minutes. See the caveat below about in-memory rate limiting.

**Secrets Management**
All API keys and secrets are read from environment variables. They are never hardcoded. `SUPABASE_SERVICE_ROLE_KEY` is never sent to the browser. It has no `NEXT_PUBLIC_` prefix and is used only in server-side code (`createAdminClient()` in `src/lib/supabase/server.ts`).

**Upload Validation**
File type and size are checked on the server before any storage upload (`src/lib/actions/upload.ts`). The browser-side check alone is not sufficient.

**No SQL Injection**
All queries use the Supabase client's parameterized query builder. There is no raw SQL string concatenation in application code.

---

## Known Limitations

**In-Memory Rate Limiting**
The contact form rate limiter resets when a Vercel serverless function restarts. Instances do not share memory. The limiter slows down abuse but does not stop a determined attacker.

To add strong rate limiting, choose one of these options:
- Add [Upstash Redis](https://upstash.com) (free tier available). Replace the `Map` in `src/app/api/contact/route.ts` with a Redis-backed limiter.
- Enable [Vercel Firewall](https://vercel.com/docs/security/vercel-firewall) rules. These run at the edge before requests reach your code.

**Custom Code Injection**
The `custom_code_snippets` feature has no sandboxing. This is intentional. It supports third-party scripts such as Google Analytics that need full page access. A compromised developer account can inject arbitrary JavaScript into the live site. Keep the number of developer-role accounts small. Use strong, unique passwords for those accounts.

**Placeholder Legal Pages**
`/src/app/privacy/page.tsx` and `/src/app/terms/page.tsx` contain placeholder text. Replace them with real policies before launch.

---

## Pre-Launch Action Items

Complete all steps below before the site goes live.

1. **Set all production environment variables** in Vercel. See `DEPLOYMENT.md`. Pay attention to `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `RECAPTCHA_SECRET_KEY`.

2. **Create your first developer account.** Use the Supabase dashboard or the invite flow at `/admin/developer/users`. Then run this SQL once in the Supabase SQL Editor to set the role:
   ```sql
   UPDATE public.profiles SET role = 'developer' WHERE id = 'YOUR-USER-UUID';
   ```

3. **Rotate any keys** that were pasted into a chat, committed to version control, or shared over email or Slack.

4. **Enable Leaked Password Protection.** Go to **Authentication → Policies** in the Supabase dashboard. This prevents users from setting passwords that appear in public breach databases.

5. **Confirm backup settings.** The Supabase free tier runs daily backups with a limited retention window. Confirm this meets your needs. Upgrade if you need point-in-time recovery.

6. **Review CORS settings** if you expose the Supabase API to another domain. This is not needed for this single-site setup.

7. **Add a Web Application Firewall** for bot and DDoS protection. Vercel Firewall and Cloudflare are two options.

---

## Reporting a Vulnerability

If you find a security issue in this codebase, fix it in a private branch and deploy before you disclose it publicly.
