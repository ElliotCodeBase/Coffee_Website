import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { parseRecipients, sendContactNotification } from "@/lib/contact-notify";

/* Remove HTML tags and trim whitespace.
   This prevents stored XSS if a message is later rendered without escaping. */
function sanitizeText(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

/* Verify a reCAPTCHA v3 token.
   Return true if verification passes.
   Return true if reCAPTCHA is not configured. This allows legitimate
   submissions before the site owner has set up reCAPTCHA. */
async function verifyRecaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    /* The token must have been issued for THIS form's action, so a token
       harvested from some other reCAPTCHA-protected page can't be replayed. */
    if (data.action !== undefined && data.action !== "contact_form") return false;
    return data.success === true && (data.score === undefined || data.score >= 0.5);
  } catch (err) {
    console.error("reCAPTCHA verification failed:", err);
    return false;
  }
}

/* In-memory rate limiter. This resets when the server restarts or a new
   serverless instance starts. It is a soft limit, not a hard guarantee.
   For stronger protection, use Upstash Redis or a Vercel Firewall rule.
   See SECURITY.md for details. */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  /* Remove expired entries when the map is large. Without this, the map
     grows by one entry per unique IP address for the lifetime of the
     server instance. This is a slow memory leak. */
  if (rateLimitMap.size > 5000) {
    for (const [key, value] of rateLimitMap) {
      if (now > value.resetAt) rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count += 1;
  return false;
}

/* Durable rate limit backed by the contact_submissions table, so it holds
   across serverless instances and restarts (the in-memory limiter above
   does not). Needs the service-role key to count rows; if that isn't
   available or the query fails, it fails OPEN and the in-memory limiter is
   the only protection — a contact form should not go down because of it. */
const GLOBAL_LIMIT_PER_HOUR = 100;

async function isRateLimitedDurable(ip: string): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const perIpSince = new Date(Date.now() - WINDOW_MS).toISOString();
    if (ip !== "unknown") {
      const { count } = await admin
        .from("contact_submissions")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gte("created_at", perIpSince);
      if ((count ?? 0) >= RATE_LIMIT) return true;
    }
    /* Overall ceiling: stops a distributed flood from burning the email
       quota or burying the inbox. */
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: total } = await admin
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", hourAgo);
    return (total ?? 0) >= GLOBAL_LIMIT_PER_HOUR;
  } catch {
    return false;
  }
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Enter a valid email address").max(320),
  topic: z.enum(["general", "catering", "beans", "feedback"]).default("general"),
  message: z.string().trim().min(1, "Message is required").max(5000),
  recaptchaToken: z.string().optional(),
  /* Honeypot. Real visitors never see or fill this field. Checked HERE, not
     only in the browser, because bots that POST straight to the API never
     run the page's JavaScript. */
  website: z.string().max(500).optional(),
});

/* Remove trailing slashes and normalize to lowercase.
   This allows comparison to succeed even when the environment variable
   has a trailing slash or different letter case. */
function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return "";
  }
}

function isAllowedOrigin(request: NextRequest): { allowed: boolean; origin: string } {
  const origin = request.headers.get("origin") ?? "";

  /* No Origin header means the request is same-origin. Safari and some
     other browsers do not send an Origin header on same-origin POST
     requests. The previous version treated a missing Origin header as a
     cross-origin request and returned 403, which broke the contact form
     for those users. */
  if (!origin) return { allowed: true, origin: "" };

  const normalized = normalizeOrigin(origin);
  if (!normalized) return { allowed: false, origin };

  const candidates = new Set<string>();
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (configured) candidates.add(configured);

  /* Also accept the origin of the incoming request. This allows preview
     deployments and apex or www domain variants to work without updating
     the environment variable. */
  const host = request.headers.get("host");
  if (host) {
    candidates.add(`https://${host.toLowerCase()}`);
    if (process.env.NODE_ENV === "development") candidates.add(`http://${host.toLowerCase()}`);
  }

  if (process.env.NODE_ENV === "development" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
    return { allowed: true, origin };
  }

  return { allowed: candidates.has(normalized), origin };
}

function corsHeaders(request: NextRequest): Record<string, string> {
  const { allowed, origin } = isAllowedOrigin(request);

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };

  /* Only set the allow-origin header for cross-origin requests.
     Same-origin requests do not need this header. */
  if (allowed && origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request);

  if (!isAllowedOrigin(request).allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403, headers });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many messages sent. Please try again later." },
      { status: 429, headers }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400, headers });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid form data." },
      { status: 400, headers }
    );
  }

  const { name, email, topic, message, recaptchaToken, website } = parsed.data;

  /* Honeypot tripped: pretend it worked so the bot learns nothing, store nothing. */
  if (website && website.trim() !== "") {
    return NextResponse.json({ success: true, message: "Message sent successfully!" }, { headers });
  }

  if (await isRateLimitedDurable(ip)) {
    return NextResponse.json(
      { error: "Too many messages sent. Please try again later." },
      { status: 429, headers }
    );
  }

  const safeName = sanitizeText(name);
  const safeMessage = sanitizeText(message);
  if (!safeName || !safeMessage) {
    return NextResponse.json({ error: "Name and message are required." }, { status: 400, headers });
  }

  const recaptchaOk = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaOk) {
    return NextResponse.json(
      { error: "Spam verification failed. Please refresh the page and try again." },
      { status: 400, headers }
    );
  }

  /* Save the submission to the database first. This is the backup record
     in case email delivery fails. The id is generated here (the public
     role can't read rows back) so the delivery result can be recorded on
     the same row afterwards. */
  const supabase = await createClient();
  const submissionId = crypto.randomUUID();
  const baseRow = { name: safeName, email, topic, message: safeMessage, ip_address: ip };

  /* Prefer the service-role client for the write. That lets
     migration_lock_contact_inserts.sql revoke the public (anon) INSERT
     grant, closing the hole where anyone holding the public anon key could
     POST straight to Supabase and skip this route's reCAPTCHA, rate limit
     and validation. If the service key isn't configured, fall back to the
     anon client so the form keeps working. */
  let db: Awaited<ReturnType<typeof createClient>> = supabase;
  let usingServiceRole = false;
  try {
    db = createAdminClient();
    usingServiceRole = true;
  } catch {
    console.warn("SUPABASE_SERVICE_ROLE_KEY is not set; saving contact messages with the public key.");
  }

  let { error: dbError } = await db
    .from("contact_submissions")
    .insert([{ id: submissionId, ...baseRow, email_status: "pending" }]);

  /* If migration_add_contact_email_status.sql hasn't been run yet, the
     insert above fails with "undefined column". Retry without the new
     columns so no message is ever lost because of deploy order. */
  const trackingAvailable = !dbError;
  if (dbError && (dbError.code === "42703" || /email_status/i.test(dbError.message ?? ""))) {
    ({ error: dbError } = await db.from("contact_submissions").insert([{ id: submissionId, ...baseRow }]));
  }
  if (dbError) {
    console.error("Failed to save contact submission:", dbError.message);
  }

  /* Recipient: CONTACT_FORM_TO_EMAIL wins (comma-separate for several),
     otherwise the company email edited in Admin → Site Info. There is no
     hard-coded fallback address any more. */
  let recipients = parseRecipients(process.env.CONTACT_FORM_TO_EMAIL);
  if (recipients.length === 0) {
    const { data: settings } = await supabase.from("site_settings").select("email").eq("id", 1).maybeSingle();
    recipients = parseRecipients(settings?.email);
  }

  const from = process.env.CONTACT_FORM_FROM_EMAIL || "onboarding@resend.dev";
  if (!process.env.CONTACT_FORM_FROM_EMAIL) {
    console.warn(
      "CONTACT_FORM_FROM_EMAIL is not set; using Resend's sandbox sender, which can only deliver to the Resend account owner's own address."
    );
  }

  const result = await sendContactNotification(
    { name: safeName, email, topic, message: safeMessage },
    { recipients, from, apiKey: process.env.RESEND_API_KEY }
  );

  if (result.status !== "sent") {
    console.error("Contact notification not delivered:", result.reason);
  }

  /* Record the outcome so a failed email is visible in Admin → Messages,
     not just in server logs. Best-effort: never blocks the response. */
  if (trackingAvailable && usingServiceRole && !dbError) {
    try {
      const { error: statusError } = await db
        .from("contact_submissions")
        .update({
          email_status: result.status,
          email_error: result.status === "sent" ? null : result.reason,
        })
        .eq("id", submissionId);
      if (statusError) console.error("Could not record email status:", statusError.message);
    } catch (err) {
      console.error("Could not record email status:", err instanceof Error ? err.message : err);
    }
  }

  /* The visitor only sees an error when NOTHING was kept: the database
     save failed AND the email didn't go out. If the message is safely in
     the admin panel, it succeeded from their point of view. */
  if (dbError && result.status !== "sent") {
    return NextResponse.json(
      {
        error:
          "We could not deliver your message right now. Please try again or contact us by phone.",
      },
      { status: 502, headers }
    );
  }

  return NextResponse.json(
    { success: true, message: "Message sent successfully!" },
    { headers }
  );
}
