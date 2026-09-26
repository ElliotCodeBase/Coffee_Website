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
  /* Optional — shown in the email header/footer. Falls back to a generic
     label if not provided, so this stays backward compatible. */
  businessName?: string;
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

/* Returns two initials for the little avatar circle in the email header
   (e.g. "Maria Lopez" -> "ML"). Falls back to "?" for empty/odd input. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase() || "?";
}

export function buildEmail(input: NotifyInput): { subject: string; text: string; html: string } {
  const topicLabel = TOPIC_LABELS[input.topic] ?? "General question";
  const business = input.businessName?.trim() || "Your website";
  /* Subject contains only a fixed label plus the sender's own name, never
     arbitrary visitor-supplied text. */
  const subject = `${business} — new message from ${input.name}`;

  const text = `New contact form message — ${business}\n\nFrom: ${input.name} <${input.email}>\nTopic: ${topicLabel}\n\n${input.message}\n\n— Reply to this email to answer them directly.`;

  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeBusiness = escapeHtml(business);
  const safeTopic = escapeHtml(topicLabel);
  const safeMessage = escapeHtml(input.message);
  const safeInitials = escapeHtml(initials(input.name));

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#f0e3d5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(28,18,12,0.08);">
      <tr>
        <td style="background:#1c120c;padding:28px 32px;">
          <p style="margin:0;color:#d99b26;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${safeBusiness}</p>
          <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700;">New website message</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:44px;height:44px;border-radius:50%;background:#f0e3d5;color:#1c120c;font-weight:700;font-size:15px;text-align:center;vertical-align:middle;" align="center">
                ${safeInitials}
              </td>
              <td style="padding-left:14px;">
                <p style="margin:0;font-size:15px;font-weight:700;color:#1c120c;">${safeName}</p>
                <p style="margin:2px 0 0;font-size:13px;">
                  <a href="mailto:${safeEmail}" style="color:#432516;text-decoration:none;">${safeEmail}</a>
                </p>
              </td>
            </tr>
          </table>
          <span style="display:inline-block;margin-top:16px;padding:4px 10px;background:#f9f4ee;color:#432516;font-size:11px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;border-radius:999px;">
            ${safeTopic}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px 8px;">
          <div style="border-left:3px solid #d99b26;padding:2px 0 2px 16px;color:#291b13;font-size:15px;line-height:1.6;white-space:pre-wrap;">${safeMessage}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 32px;">
          <a href="mailto:${safeEmail}" style="display:inline-block;background:#1c120c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:8px;">
            Reply to ${safeName}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 28px;border-top:1px solid #f0e3d5;">
          <p style="margin:18px 0 0;color:#a99a8c;font-size:12px;">
            Sent automatically from your ${safeBusiness} contact form. Change where these go anytime in Admin → Site Info → Contact.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

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
      reason: "No recipient configured. Fill in the Email field in Admin → Site Info → Contact (or set CONTACT_FORM_TO_EMAIL as a fallback).",
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
