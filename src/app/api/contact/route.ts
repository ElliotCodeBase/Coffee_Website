import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Strips HTML tags and trims a string to prevent stored-XSS via
 * DB-backed messages being rendered without escaping.
 */
function sanitizeText(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

/**
 * Verifies a reCAPTCHA v3 token. Returns true when verification passes,
 * or when reCAPTCHA is not yet configured (so we don't block legit
 * submissions before the site owner has set it up).
 */
async function verifyRecaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return data.success === true && (data.score === undefined || data.score >= 0.5);
  } catch (err) {
    console.error("reCAPTCHA verification failed:", err);
    return false;
  }
}

// ── Rate limiter (in-memory, resets on cold start) ───────────────────────
// For a production multi-instance deployment, replace with Upstash Redis
// or a Vercel Firewall rule. See SECURITY.md.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Prune expired entries. Without this the map grows once per distinct
  // client IP for the lifetime of the instance and is never reclaimed —
  // a slow memory leak that doubles as a cheap DoS vector.
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

// ── Schema ───────────────────────────────────────────────────────────────
const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Please provide a valid email").max(320),
  topic: z.enum(["general", "catering", "beans", "feedback"]).default("general"),
  message: z.string().trim().min(1, "Message is required").max(5000),
  recaptchaToken: z.string().optional(),
});

// ── CORS helper ──────────────────────────────────────────────────────────

/** Strips a trailing slash and lowercases, so the comparison survives an
 *  env var written as "https://example.com/". */
function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return "";
  }
}

function isAllowedOrigin(request: NextRequest): { allowed: boolean; origin: string } {
  const origin = request.headers.get("origin") ?? "";

  // No Origin header at all means the request is same-origin (Safari and
  // several other engines omit it on same-origin POSTs) or is not a
  // browser fetch. The previous version treated this as a cross-origin
  // request from "null" and returned 403 — which broke the contact form
  // outright for those users.
  if (!origin) return { allowed: true, origin: "" };

  const normalized = normalizeOrigin(origin);
  if (!normalized) return { allowed: false, origin };

  const candidates = new Set<string>();
  const configured = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (configured) candidates.add(configured);

  // Also accept the origin the request actually arrived on, so a preview
  // deployment or an apex/www variant isn't rejected because
  // NEXT_PUBLIC_SITE_URL names only one of them.
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

  // Only echo an allow-origin when there was a cross-origin request to
  // allow; a same-origin POST needs no CORS header at all.
  if (allowed && origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

// ── OPTIONS preflight ─────────────────────────────────────────────────────
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

// ── POST handler ──────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const headers = corsHeaders(request);

  // Block cross-origin requests from disallowed origins
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

  const { name, email, topic, message, recaptchaToken } = parsed.data;

  // Sanitize text inputs before writing to DB / sending in email
  const safeName = sanitizeText(name);
  const safeMessage = sanitizeText(message);

  const recaptchaOk = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaOk) {
    return NextResponse.json(
      { error: "Spam verification failed. Please refresh the page and try again." },
      { status: 400, headers }
    );
  }

  // 1. Save to DB first — this is our backup even if email delivery fails.
  const supabase = await createClient();
  const { error: dbError } = await supabase.from("contact_submissions").insert([
    {
      name: safeName,
      email,
      topic,
      message: safeMessage,
      ip_address: ip,
    },
  ]);

  if (dbError) {
    console.error("Failed to save contact submission:", dbError.message);
  }

  // 2. Send real email via Resend (key is server-side only).
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.CONTACT_FORM_FROM_EMAIL || "onboarding@resend.dev",
      to: process.env.CONTACT_FORM_TO_EMAIL || "hello@caffeinecoffee.com",
      replyTo: email,
      subject: `New contact form message: ${topic}`,
      text: `From: ${safeName} <${email}>\nTopic: ${topic}\n\n${safeMessage}`,
    });
  } catch (emailError) {
    console.error("Failed to send contact email:", emailError);
    if (dbError) {
      return NextResponse.json(
        {
          error:
            "We couldn't deliver your message right now. Please try again or call us directly.",
        },
        { status: 502, headers }
      );
    }
  }

  return NextResponse.json(
    { success: true, message: "Message sent successfully!" },
    { headers }
  );
}
