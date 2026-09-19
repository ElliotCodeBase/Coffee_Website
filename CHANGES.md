# Change log, how to access, and fix guide

> Living document. Each section is added when its item is finished and tested.
> **How this was verified:** the sandbox used for this work had **no internet and no access to your Supabase project**, so
> the app could not be run end-to-end. Every change was checked with a strict TypeScript pass (0 errors) and, where the
> logic is pure, with unit tests using a mocked Supabase client. Anything that needs the real Supabase/Resend account to
> confirm is marked **NEEDS YOUR CHECK**.

## Status

| # | Item | Result |
|---|------|--------|
| 1 | Team invite failure | **Root cause confirmed from your Supabase Auth logs** (built-in email rate limit). Code fixed; **you still need to set up custom SMTP** (section 1) |
| 2 | Contact form → email | Root cause found and fixed. **Needs your Resend/env setup** (section 2) |
| 3 | Menu edit layout | Fixed. Original bug reproduced, fix verified in a real browser |
| 4 | Admin Overview redesign | Done. Verified at desktop and phone widths |
| 5 | Side-scroll redesign | Done, **but see the note in section 5: the public site had no carousel to redesign** |
| S | Security review | 13 issues fixed in code, 2 need an action from you, 6 flagged for your decision (section S) |

## Quick access

| What | Where |
|------|-------|
| Overview (redesigned) | `/admin` |
| Menu editor (now an overlay) | `/admin/menu` → **Edit** or **+ Add item** |
| Team invites | `/admin/staff` → **Send invite** |
| Messages + "Email not sent" badge | `/admin/messages` |
| Site Info (tab rail) | `/admin/site-info` |
| Phone menu side-scroller | Homepage `#menu`, on a screen narrower than 640px |
| Roles / developer invite | `/admin/developer/users` (developer account) |

## Do this, in this order

1. **Deploy the new code** (nothing below breaks if you do this first).
2. **Environment variables** (hosting dashboard, then redeploy): `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CONTACT_FORM_FROM_EMAIL`, optional `CONTACT_FORM_TO_EMAIL`. See `.env.example`.
3. **Supabase → Authentication → Sign In / Providers → turn OFF "Allow new users to sign up"** (security item S1) **and set up custom SMTP** (section 1). I can't read or change either from here.
4. ~~Run `migration_add_contact_email_status.sql`~~ **Already applied to your Supabase project** (see "Applied to your Supabase project").
5. Send one test contact message on the live site; confirm it appears in Messages **and** in the inbox.
6. Then run `supabase/migration_lock_contact_inserts.sql` (closes the public write path; **do not run it before step 5**).
7. Optional, your decision: `supabase/migration_invite_only_profiles.sql` (see S2 for what it changes).

**Breaking changes:** none are forced. The two migrations that change behaviour (steps 6 and 7) are opt-in and explained inside each file.
If you ever ran the old `migration_fix_missing_grants.sql`, re-run step 7 of `migration_security_hardening.sql` to remove anonymous write grants.

---

## 1. Team invite failure

**Symptom:** Admin → Team → "Send invite" always says *"Failed to send invite. The email address may already be in use."*

**What was wrong in the code (certain):**
The `catch` path threw away the real Supabase error and printed the same "may already be in use" guess for *every* failure.
So the message was misleading, and nobody could tell whether the cause was a duplicate, email delivery, a bad key, or a database trigger.

**Root cause: CONFIRMED from your Supabase Auth logs (2026-09-19).**
It was never a duplicate email. Supabase's *built-in* email service only allows a couple of emails per hour, and your project had used its allowance:

| Time (UTC) | Invite to | Result |
|---|---|---|
| 10:39:12 | `dezart002@gmail.com` | **Succeeded** (email sent via Supabase's `noreply@mail.app.supabase.io`) |
| 10:40:27 – 10:45:02 | 3 other addresses, 5 attempts | **`429: email rate limit exceeded`** (`over_email_send_rate_limit`) |

Each failed attempt rolled back cleanly (no half-created accounts exist), and the old code turned every one into "may already be in use".
Your service key and database trigger are fine (checked live), so those other suspected causes are ruled out.

**The permanent fix is yours to do (I can't change Supabase Auth settings from here):**
Supabase Dashboard → Authentication → **SMTP Settings** → enable custom SMTP. With Resend: host `smtp.resend.com`, port `465`, username `resend`, password = your Resend API key, sender = an address on a domain verified in Resend.
Until then the new code keeps you unblocked: when the limit is hit it creates the invite anyway and shows a **Copy link** box to send by hand.

*Other failure types the new messages also cover (not seen in your logs):* address already activated, address not on your Supabase team, bad service key, database trigger error.

**What changed**
| File | Change |
|------|--------|
| `src/lib/auth-errors.ts` (new) | Classifies the real Supabase error into: exists / email delivery / config / database / invalid email / unknown, with a plain-language fix for each. |
| `src/lib/invite.ts` (new) | One shared invite routine for both invite forms. Logs the real error server-side. If only the *email* fails, it creates the invite **without emailing** and returns a link you can send by hand. |
| `src/lib/supabase/server.ts` | `createAdminClient()` is now a plain service-role `supabase-js` client (no cookies/session) and throws a readable error if the key is missing or equals the anon key. |
| `src/lib/actions/staff.ts` | `addTeamMember` uses the shared routine; email is lower-cased and length-checked. |
| `src/lib/actions/developer.ts` | `inviteUser` uses the same routine. |
| `src/components/admin/InviteLinkNotice.tsx` (new) | Amber box with the manual invite link + Copy button. |
| `StaffManager.tsx`, `UsersManager.tsx` | Show the real error / the manual link. `UsersManager` no longer ignores failures. |

**Also fixed while in here**
- **Profile write could fail silently.** `update()` matched 0 rows and reported success if the profile row was missing. Now an `upsert`, and a failure is reported.
- **Re-inviting can't downgrade** a developer or the Main Admin.
- **`updateUserRole` did nothing** (Users & Roles page). `profiles` has no UPDATE policy by design, so the write matched 0 rows and still said "success". Now written with the service-role client after the developer check, and it verifies a row changed.
- **`transferMainAdmin` race:** two parallel updates against a one-main-admin unique index could leave the site with **no Main Admin**. Now sequential with rollback.
- `removeUser` now refuses to delete the Main Admin (the Team page already did).

**How to use it:** Admin → Team → fill name/email/access level → **Send invite**.
If the email can't be sent you'll now see the real reason plus a **Copy link** box.

**If it still fails, in this order:**
1. Read the message shown; it now names the cause.
2. *"built-in email service…"* → Supabase Dashboard → Authentication → **SMTP Settings** → enable custom SMTP (Resend works: host `smtp.resend.com`, port `465`, user `resend`, password = your Resend API key, sender on a verified domain).
3. *"server couldn't authenticate…"* → hosting env vars: `SUPABASE_SERVICE_ROLE_KEY` must be the **service_role** secret (Supabase → Project Settings → API). Redeploy after changing.
4. *"database error…"* → Supabase → SQL editor, run: `select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal;` and re-run `supabase/migration_security_hardening.sql`. Then check Logs → Postgres for the exact failure.
5. Anything else → Supabase → **Logs → Auth**, filter by the `reference:` code shown in the message, and send me that line.
6. Quick diagnostic: the Developer → Users invite now uses the same code, so trying it there gives the same message.


---

## 2. Contact form → notification email

**Symptom:** messages appear in Admin → Messages but no email arrives.

**Root cause (certain, from the code):** the email SDK (Resend) does **not throw** when the provider rejects a send
(wrong/missing key, unverified sender domain, sandbox sender, quota). It returns `{ data: null, error }`.
The old route only had a `try/catch` and never read `error`, so **every provider rejection was treated as success**.
The visitor saw "Message sent!" and nobody was told. There was also a hard-coded fallback recipient.

**What changed**
| File | Change |
|------|--------|
| `src/lib/contact-notify.ts` (new) | Builds and sends the email; **always checks `error`**; returns `sent / failed / skipped` plus a short, secret-free reason. Email body is HTML-escaped and the subject is a fixed label (no header injection). |
| `src/app/api/contact/route.ts` | Uses the notifier. Recipient = `CONTACT_FORM_TO_EMAIL` (comma-separate for several) **else the Email set in Admin → Site Info**. No hard-coded address. Records the result on the message. Logs failures. |
| `supabase/migration_add_contact_email_status.sql` (new) | Adds `email_status` / `email_error` columns. **Optional but recommended.** Safe in any deploy order (the route retries without the columns if they don't exist yet). |
| `MessagesList.tsx` | Shows an amber **"Email not sent"** badge (hover for the reason) on any message whose notification failed. |
| `supabase/schema.sql`, `src/types/database.ts` | Kept in sync. |

**Also hardened here (found while in this file)**
- **Direct-insert hole:** the public anon key could write to `contact_submissions` straight through Supabase's REST API, skipping reCAPTCHA, rate limit and validation. The route now saves with the service-role key, and `supabase/migration_lock_contact_inserts.sql` removes the public write path. **Run that migration only after a test message works on the live site** (details inside the file).
- Honeypot is now checked **on the server** (before, only in the browser, so bots posting directly skipped it).
- Rate limit is now also **database-backed** (5 per IP / 10 min, 100 total / hour) so it works across serverless instances; the old in-memory limit resets constantly.
- reCAPTCHA token must be for the `contact_form` action; the Google call has a 5-second timeout.

**What YOU must do (NEEDS YOUR INPUT)**
1. **Which address should receive messages?** Currently: `CONTACT_FORM_TO_EMAIL` if set, otherwise the Email in Admin → Site Info (seeded as `hello@caffeinecoffee.com`). Tell me if you want something else.
2. In your hosting env set: `RESEND_API_KEY`, `CONTACT_FORM_FROM_EMAIL` (an address on a domain **verified in Resend** → Domains), optionally `CONTACT_FORM_TO_EMAIL`. Redeploy.
3. Send a test message on the live site. If it fails you'll now see **"Email not sent"** in Admin → Messages with the provider's reason.

**Troubleshooting**
| Reason shown | Fix |
|---|---|
| `RESEND_API_KEY is not set` | Add it to hosting env vars, redeploy. |
| `…domain is not verified` / `403` | Resend → Domains → verify your domain (DNS records), and make `CONTACT_FORM_FROM_EMAIL` use it. |
| `You can only send testing emails to your own email address` | You're on the sandbox sender. Set `CONTACT_FORM_FROM_EMAIL` to a verified-domain address. |
| `No recipient configured` | Set `CONTACT_FORM_TO_EMAIL` or fill Admin → Site Info → Email. |
| Nothing at all, no badge | Check spam; check hosting logs for `Contact notification not delivered:`. |

---

## 3. Menu item edit layout bug

**Symptom:** clicking Edit stretched the card and pushed the form off-screen.

**Root cause:** the editor replaced the card *inside* the grid. The grid uses `auto-rows-fr` (every row = height of the tallest),
so the tall form made **every row taller**, and the form opened wherever that grid row was (often below the fold).

**Fix:** editing/creating now opens in a centered **overlay dialog**; the grid is never touched.
| File | Change |
|------|--------|
| `src/components/admin/AdminModal.tsx` (new) | Accessible modal: portal, scroll lock, Escape / ✕ / outside-click to close, Tab stays inside, focus returns to the Edit button, **asks before discarding typed changes**, bottom-sheet on phones. |
| `MenuItemsManager.tsx` | Uses the modal for both **Edit** and **+ Add item**; Save/Cancel bar is sticky so it is always reachable. |

**Verified** in headless Chromium with the real component: original → card height 419px→531px and last card pushed down 225px;
fixed → layout identical, dialog fully inside viewport (also at 500px tall), 17/17 behavior checks.
*(Layout CSS in that test was a hand-written subset because Tailwind can't be installed offline — please eyeball the final look.)*

**If it misbehaves:** dialog can't scroll → make sure nothing sets `overflow:hidden` on `<html>`; Escape does nothing → a browser extension may be grabbing the key, use the ✕ button.


---

## 4. Admin Overview redesign

**Before:** three plain number tiles, a text-link list, and widths that didn't match any other page.
**Now:** built from the same parts as the rest of the admin: white `rounded-xl` cards with stone borders, Cozy headings, the sidebar's own icons, and the same NEW / READ / ARCHIVED chips as Messages.

| Piece | Detail |
|---|---|
| Stat cards | Menu items (with "N hidden from the site"), New messages (turns blue when there are unread ones), Visits this week (admins only, with the all-time count). Whole card is a link. |
| Recent messages | The latest 5, with name, status, topic, preview and time. Empty state explains what will appear. |
| Shortcuts | Site info, Menu, Messages, Team (and Analytics for admins), each with icon and one-line description. |
| Email alert | An amber banner appears only if some messages couldn't be emailed (ties into item 2). |

Files: `src/app/admin/(dashboard)/page.tsx`, new `src/components/admin/icons.ts` (the sidebar now imports the same icon paths, so a section keeps one icon everywhere).
While testing on a 390px phone I found and fixed a real overflow bug (grid children need `min-w-0`).
**How to fix if it looks wrong:** a stat shows 0 for visits → only the *admin* role can read visits (by design). The email banner never appears → run `migration_add_contact_email_status.sql`.

---

## 5. Side-scroll redesign

**Please read:** the site you sent me has **no horizontal carousel or gallery**. The public menu is a grid, and the hero only moves sideways as a scroll effect.
The only true side-scrolling elements were the **admin Site Info tab rail** and, arguably, the **phone menu**, which crammed four tiny columns onto a phone.
So instead of inventing a gallery, I built **one shared side-scroll pattern** and applied it where sideways scrolling exists or clearly belongs.
**If you meant a different section (a gallery? a testimonials strip?) tell me and it will use the same component.**

**The pattern (same everywhere):** snap points; the next card peeks in so it's obvious there's more; edges fade only on the side that has more; arrow buttons on mouse devices, only when content overflows; keyboard Left/Right; no scrollbar; reduced-motion respected.

| File | Change |
|---|---|
| `src/components/shared/HScroller.tsx` (new) | The reusable component. |
| `src/lib/use-scroll-edges.ts` (new) | Shared behaviour hook (used by HScroller and the admin rail). |
| `src/app/globals.css` | `.hscroll*` styles, in `@layer components` so Tailwind utilities can still override them. |
| `src/components/site/Menu.tsx` | **Phones (<640px):** one readable, swipeable row per category with *all* items. **Tablet/desktop: unchanged** (grid + "See more"). |
| `src/components/admin/SiteInfoManager.tsx` | Tab rail uses the same behaviour on phones; still a vertical list on large screens. |

Verified in Chromium: 17/17 (menu) and 9/9 (rail) including snap, peek, arrow states, keyboard, and that desktop is unchanged.
*Not verified:* how it looks with your real photos and theme colours (test used placeholder images and approximate CSS).
**Design decisions for you:** phone card style (I used the site's cream card with a 4:3 photo), item width (`itemWidth` prop, default ≈ 78% so the next card peeks), and whether you also want a scroller on tablets.
**How to fix:** arrows missing on desktop → they only show when the row overflows; row won't scroll on iPhone → check that no ancestor has `overflow:hidden` with a transform.

---

## S. Security review

Scope: code, SQL/RLS, auth flows, forms, secrets. **Not possible from here:** inspecting your live Supabase settings, so items marked **CHECK** depend on them.

### Secrets: clean
No `.env` files or keys in the zip; `.gitignore` covers them; the service-role key is only used in server code and never in a client component; the only browser-visible variables are the four `NEXT_PUBLIC_*` ones (Supabase URL, anon key, site URL, reCAPTCHA site key), which are meant to be public.

### Fixed in code
| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | High | Anyone with the public anon key could POST straight to Supabase and write contact messages, skipping reCAPTCHA, rate limit and validation | Server saves with the service key; `migration_lock_contact_inserts.sql` removes the public write path |
| 2 | High* | A signed-in account with no role (e.g. self-registered) passed the middleware into `/admin` | Middleware and layout now require a known role |
| 3 | Medium | Stored XSS: Site Info values were placed in the JSON-LD `<script>` without escaping `<` (any admin could do it) | `<` escaped; round-trip tested |
| 4 | Medium | Stored XSS: theme colours/fonts went unvalidated into a `<style>` block | Strict hex/font validation on save **and** on render |
| 5 | Medium | Uploads trusted the browser's MIME type | File type now read from the file's real bytes (JPEG/PNG/GIF/WebP only) |
| 6 | Medium | `transferMainAdmin` could leave the site with no Main Admin | Sequential with rollback |
| 7 | Medium | Old `migration_fix_missing_grants.sql` re-granted anonymous full write on every table | Rewritten to least privilege |
| 8 | Low | Site Info: email not validated (rendered as `mailto:`), map iframe accepted any URL, no length caps | Validated; map limited to https Google Maps / OpenStreetMap; caps added |
| 9 | Low | Contact honeypot only checked in the browser | Checked on the server |
| 10 | Low | Rate limit was in-memory only (resets per serverless instance) | Also database-backed (5/IP/10 min, 100/hour overall) |
| 11 | Low | reCAPTCHA token not tied to the form's action; no timeout | Action checked; 5 s timeout |
| 12 | Low | Developer actions lacked ID/role/location/size validation; `removeUser` could delete the Main Admin | Validated; Main Admin protected |
| 13 | Functional | Role changes on Users & Roles silently did nothing (no UPDATE policy on `profiles`) | Written via service role after the developer check; verifies a row changed |

*High only if public sign-ups are enabled, see S1.

### Needs an action from you
- **S1 (CHECK, High):** In Supabase → Authentication → Sign In / Providers, is **"Allow new users to sign up"** on? It is on by default. If so, anyone can register and receive a `staff` profile, which can read every contact message (names, emails, IPs), see analytics, edit the menu and upload images. **Turn it off.** Invites from the admin panel keep working.
- **S2 (decision):** `migration_invite_only_profiles.sql` makes a self-registered account get *no* profile at all (defence in depth). Cost: the Supabase dashboard's "Add user" no longer auto-creates a profile, so creating a new first admin needs one SQL line (included in the file).

### Flagged, not changed (your call)
1. **Any admin can invite other admins and remove other admins** (only the Main Admin is protected). Should only the Main Admin be able to grant/revoke admin?
2. **Custom Code feature = arbitrary JavaScript on the public site** by design, so no strict CSP is possible. Keep developer accounts to the minimum and enable MFA on them.
3. **Custom Code snippets may never reach visitors:** the RLS policy lets only `developer` read them, so the public site's query returns nothing. If your analytics tags aren't firing, that's why. (Not confirmed against your live DB.)
4. **Passwords:** the app requires 8 characters. Consider a higher minimum plus leaked-password protection and MFA in Supabase.
5. **Login brute-force:** relies on Supabase's built-in auth rate limits; there is no app-level lockout.
6. **Team and Users pages call `listUsers()` without paging**, so only the first 50 accounts show. Fine for a small team.
Also: IP addresses come from `x-forwarded-for`, which is trustworthy on Vercel but spoofable behind some other proxies.

---

## Decisions I need from you

1. Which address receives contact-form emails? (currently `CONTACT_FORM_TO_EMAIL`, else Site Info → Email, which is `jorenemencianomendez@gmail.com`)
2. Do you want the **manual invite link** fallback when Supabase can't send email, or should invites just fail with the message?
3. Item 5: was there a specific carousel or gallery you meant? Design direction for the phone menu cards?
4. S1 and S2 above, and flagged item 1 (who may grant admin).
5. ~~Supabase access~~ Done: the invite cause is confirmed from your logs (section 1).

---

## Applied to your Supabase project ("Coffee Shop", `ipmctnjlorltdranughu`)

I connected with your permission and made **three additive changes**, each verified by reading the database back. Your other project (`ryhar-portfolio`) was not touched.

| Migration (in your history) | What it does | Risk |
|---|---|---|
| `add_contact_email_status` | Adds `email_status` / `email_error` columns so failed notification emails show in Admin → Messages | None (new nullable columns) |
| `profiles_role_default_staff` | New profiles default to `staff`, not `admin`. Live default was `admin`, so any insert that forgot to name a role made an admin. Existing accounts unchanged | None (trigger and app already set the role explicitly) |
| `contact_submissions_size_limits` | Caps name 200 / email 320 / message 5000 / topic 50 characters, even for direct API inserts | None (matches the form's own limits; existing data passes) |

**Read-only findings from the live database**
- Matches your repo: RLS on every table, no UPDATE policy on `profiles` (so the old role-change bug was real), sign-up trigger is the hardened one, and the anonymous role's grants are already least-privilege (the bad grants file was never in effect).
- Two accounts: your Main Admin, and `dezart002@gmail.com` (staff, activated 9/19).
- Supabase's own security advisor shows 3 warnings. **Two I deliberately left alone:** `current_user_role()` being callable via the API. Your RLS policies depend on it, and a previous attempt to revoke it broke the site (your history has `restore_anon_execute_current_user_role`); it only returns the caller's own role. **One is yours to enable:** leaked-password protection (Dashboard → Authentication → Password security; may need a paid plan).
- Custom Code snippets table is empty, so flagged item 3 (visitors can't read snippets) has no effect today.
- The company email in Site Info is `jorenemencianomendez@gmail.com`, so contact emails go there unless you set `CONTACT_FORM_TO_EMAIL`.
- Your invite emails and links point at `http://localhost:3000`. That is fine while developing, but before going live set `NEXT_PUBLIC_SITE_URL` to your real address and add it under Authentication → URL Configuration → Redirect URLs.

**Deliberately NOT applied**
- `migration_lock_contact_inserts.sql`: it removes the public write path that your *currently running* site uses. It would stop the contact form saving until the new code and `SUPABASE_SERVICE_ROLE_KEY` are deployed. Run it after a successful test message (step 6 above); say the word and I'll apply it then.
- `migration_invite_only_profiles.sql`: changes how accounts are created; needs your decision (S2).

---

## How this was tested (and what wasn't)

| Check | Result |
|---|---|
| Strict TypeScript over all source (offline stubs for Next/Supabase/Resend/zod) | 0 errors; harness confirmed to catch planted errors; baseline on your original was also 0 |
| Invite logic, 9 scenarios (mocked Supabase) | pass |
| Auth error classifier, 12 cases | pass |
| Contact notifier, 7 checks including the original silent-failure case | pass |
| Image sniffer, 11 cases (incl. HTML/SVG disguised as images) | pass |
| JSON-LD escaping round-trip | pass |
| Chromium: menu edit overlay, 17 checks (original reproduced the bug first) | pass |
| Chromium: phone menu side-scroller, 17 checks | pass |
| Chromium: admin tab rail, 9 checks | pass |
| Chromium: Overview at 1280px and 390px (screenshots reviewed) | pass |

**Not tested:** the app code against your real Supabase (I could read and change the database, but the site itself was not run against it) or any Resend account; `next build` and ESLint (packages can't be installed offline, so **run `npm install && npm run build && npm run lint` once before deploying**); final look with Tailwind, your photos and theme colours.

---

## Every file changed

**New (13):** `src/components/admin/{AdminModal.tsx, InviteLinkNotice.tsx, icons.ts}`, `src/components/shared/HScroller.tsx`, `src/lib/{auth-errors.ts, contact-notify.ts, image-sniff.ts, invite.ts, theme-sanitize.ts, use-scroll-edges.ts}`, `supabase/{migration_add_contact_email_status.sql, migration_invite_only_profiles.sql, migration_lock_contact_inserts.sql}`

**Edited (24):** `.env.example`, `src/app/{page.tsx, globals.css}`, `src/app/admin/(dashboard)/{layout.tsx, page.tsx}`, `src/app/api/contact/route.ts`, `src/components/admin/{AdminSidebar, MenuItemsManager, MessagesList, SiteInfoManager, StaffManager, UsersManager}.tsx`, `src/components/site/{ContactForm, Menu, ThemeVars}.tsx`, `src/lib/actions/{developer, site-settings, staff, upload}.ts`, `src/lib/supabase/server.ts`, `src/proxy.ts`, `src/types/database.ts`, `supabase/{migration_fix_missing_grants.sql, schema.sql}`

## Quick fix index

| Symptom | Go to |
|---|---|
| Invite fails | Section 1, troubleshooting list (read the message; it names the cause) |
| No contact email | Section 2 table; check Messages for **Email not sent** |
| Edit dialog won't scroll/close | Section 3 |
| Overview shows 0 visits | Section 4 (admins only) |
| Menu row won't swipe / no arrows | Section 5 |
| Locked out of admin after a migration | Run the bootstrap SQL inside `migration_invite_only_profiles.sql` |
| Contact form stopped saving after `migration_lock_contact_inserts.sql` | `SUPABASE_SERVICE_ROLE_KEY` is missing in hosting env; set it, redeploy. Emergency undo (both lines are needed, the migration removed a grant **and** a policy): `grant insert on public.contact_submissions to anon;` then `create policy "anyone can submit contact form" on public.contact_submissions for insert with check (true);` |
