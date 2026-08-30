import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Please provide a valid email").max(320),
  topic: z.enum(["general", "catering", "beans", "feedback"]).default("general"),
  message: z.string().trim().min(1, "Message is required").max(5000),
  recaptchaToken: z.string().optional(),
});

/**
 * Verifies a reCAPTCHA v3 token with Google. Returns true if verification
 * passes (or if reCAPTCHA isn't configured — no secret key means the site
 * owner hasn't set it up yet, so we don't block legitimate submissions).
 */
async function verifyRecaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // Not configured — skip verification.
  if (!token) return false; // Configured but no token provided — likely a bot or scripted request.

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    // v3 returns a 0.0-1.0 score; 0.5 is Google's suggested default threshold.
    return data.success === true && (data.score === undefined || data.score >= 0.5);
  } catch (err) {
    console.error("reCAPTCHA verification failed:", err);
    return false;
  }
}

/**
 * Very simple in-memory rate limiter: 5 requests per IP per 10 minutes.
 *
 * CAVEAT: this resets whenever the serverless function cold-starts, and
 * doesn't share state across multiple instances. It's a reasonable first
 * line of defense for a small site, but for real protection at scale,
 * replace this with Upstash Redis (has a free tier) or a WAF-level rule
 * (Vercel Firewall / Cloudflare) — see SECURITY.md.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  entry.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many messages sent. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid form data." },
      { status: 400 }
    );
  }

  const { name, email, topic, message, recaptchaToken } = parsed.data;

  const recaptchaOk = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaOk) {
    return NextResponse.json(
      { error: "Spam verification failed. Please refresh the page and try again." },
      { status: 400 }
    );
  }

  // 1. Save to DB first — this is our backup even if email delivery fails.
  const supabase = await createClient();
  const { error: dbError } = await supabase.from("contact_submissions").insert([
    {
      name,
      email,
      topic,
      message,
      ip_address: ip,
    },
  ]);

  if (dbError) {
    console.error("Failed to save contact submission:", dbError.message);
    // Don't fail the whole request just because DB backup failed —
    // still attempt to send the email so the client doesn't lose the message.
  }

  // 2. Send real email via Resend.
  try {
    await resend.emails.send({
      from: process.env.CONTACT_FORM_FROM_EMAIL || "onboarding@resend.dev",
      to: process.env.CONTACT_FORM_TO_EMAIL || "hello@caffeinecoffee.com",
      replyTo: email,
      subject: `New contact form message: ${topic}`,
      text: `From: ${name} <${email}>\nTopic: ${topic}\n\n${message}`,
    });
  } catch (emailError) {
    console.error("Failed to send contact email:", emailError);
    // If BOTH the DB save and email failed, tell the user honestly.
    if (dbError) {
      return NextResponse.json(
        { error: "We couldn't deliver your message right now. Please try again or call us directly." },
        { status: 502 }
      );
    }
    // DB save succeeded even though email failed — message is not lost.
  }

  return NextResponse.json({ success: true, message: "Message sent successfully!" });
}
