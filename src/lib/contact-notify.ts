import { Resend } from "resend";

/* Sends the "new contact form message" notification email.

   Why this is its own module: the Resend SDK does NOT throw when the API
   rejects a request (bad key, unverified sender domain, sandbox sender
   mailing a stranger, quota…). It resolves with `{ data: null, error }`.
   The previous code only wrapped the call in try/catch and never read
   `error`, so every one of those failures was silently treated as success —
   which is exactly why messages showed up in the admin panel but never in
   an inbox. This module always inspects `error` and reports a precise,
   secret-free reason that is stored next to the message. */

export type NotifyResult =
  | { status: "sent" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

export interface NotifyInput {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export interface EmailClient {
  emails: {
    send(payload: {
      from: string;
      to: string[];
      replyTo: string;
      subject: string;
      text: string;
      html: string;
    }): Promise<{ data: unknown; error: { name?: string; message?: string; statusCode?: number | null } | null }>;
  };
}

const TOPIC_LABELS: Record<string, string> = {
  general: "General question",
  catering: "Private events & catering",
  beans: "Wholesale coffee beans",
  feedback: "Feedback",
};

const RECIPIENT_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

/* Accepts one address or a comma/semicolon-separated list. Invalid entries
   are dropped, and at most 5 recipients are used. */
export function parseRecipients(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(/[,;]/)) {
    const addr = part.trim().toLowerCase();
    if (addr && addr.length <= 254 && RECIPIENT_RE.test(addr)) seen.add(addr);
  }
  return [...seen].slice(0, 5);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildEmail(input: NotifyInput): { subject: string; text: string; html: string } {
  const topicLabel = TOPIC_LABELS[input.topic] ?? "General question";
  /* Subject contains only a fixed label, never visitor-supplied text. */
  const subject = `New website message: ${topicLabel}`;
  const text = `From: ${input.name} <${input.email}>\nTopic: ${topicLabel}\n\n${input.message}\n\n— Reply to this email to answer them directly.`;
  const html =
    `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;color:#1c120c">` +
    `<h2 style="margin:0 0 4px;font-size:18px">New website message</h2>` +
    `<p style="margin:0 0 16px;color:#6b5b4f;font-size:13px">${escapeHtml(topicLabel)}</p>` +
    `<p style="margin:0 0 2px"><strong>${escapeHtml(input.name)}</strong></p>` +
    `<p style="margin:0 0 16px"><a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a></p>` +
    `<div style="white-space:pre-wrap;border-left:3px solid #d99b26;padding:4px 0 4px 12px;font-size:15px;line-height:1.5">${escapeHtml(input.message)}</div>` +
    `<p style="margin:20px 0 0;color:#6b5b4f;font-size:12px">Reply to this email to answer them directly.</p>` +
    `</div>`;
  return { subject, text, html };
}

function shorten(value: string, max = 300): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export async function sendContactNotification(
  input: NotifyInput,
  opts: { recipients: string[]; from: string; apiKey?: string; client?: EmailClient }
): Promise<NotifyResult> {
  if (opts.recipients.length === 0) {
    return {
      status: "skipped",
      reason: "No recipient configured. Set CONTACT_FORM_TO_EMAIL, or fill in the Email field in Admin → Site Info.",
    };
  }

  let client = opts.client;
  if (!client) {
    if (!opts.apiKey) return { status: "failed", reason: "RESEND_API_KEY is not set on the server." };
    client = new Resend(opts.apiKey) as unknown as EmailClient;
  }

  const { subject, text, html } = buildEmail(input);

  try {
    const { error } = await client.emails.send({
      from: opts.from,
      to: opts.recipients,
      replyTo: input.email,
      subject,
      text,
      html,
    });
    if (error) {
      const reason = shorten(`${error.name ?? "resend_error"}${error.statusCode ? ` (${error.statusCode})` : ""}: ${error.message ?? "unknown error"}`);
      return { status: "failed", reason };
    }
    return { status: "sent" };
  } catch (err) {
    return { status: "failed", reason: shorten(`Could not reach the email provider: ${err instanceof Error ? err.message : String(err)}`) };
  }
}
