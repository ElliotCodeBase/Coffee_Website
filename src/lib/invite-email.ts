/* The designed invitation email for new team members (staff and admins).

   Pure functions only (no server imports) so the same template is used for
   the email the site sends itself AND for the copy that can be pasted into
   Supabase's own "Invite user" email template (supabase/email-templates).

   Email clients ignore most modern CSS, so this is deliberately old-school:
   table layout, inline styles, system fonts, a "bulletproof" button, and a
   plain-text alternative. Every value that comes from a person (names, the
   business name) is HTML-escaped. */

export type InviteRole = "admin" | "staff" | "developer";

export interface InviteEmailInput {
  businessName: string;
  /** The link that sets up the account. */
  inviteLink: string;
  role: InviteRole;
  /** Name of the person being invited, if known. */
  fullName?: string | null;
  /** Name of whoever sent the invite, if known. */
  invitedBy?: string | null;
  /** Brand colors (hex). Anything missing or invalid falls back to the defaults. */
  colors?: { dark?: string | null; accent?: string | null; cream?: string | null; gold?: string | null };
}

const HEX = /^#[0-9a-f]{6}$/i;
const pick = (value: string | null | undefined, fallback: string) => (value && HEX.test(value.trim()) ? value.trim() : fallback);

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ROLE_COPY: Record<InviteRole, { label: string; can: string[] }> = {
  staff: {
    label: "Staff",
    can: [
      "Add, edit and hide menu items",
      "Read and reply to messages from the contact form",
      "See how many people visit the website",
    ],
  },
  admin: {
    label: "Admin",
    can: [
      "Everything staff can do",
      "Change the website's text, photos, hours and colors",
      "Invite and manage your team",
    ],
  },
  developer: {
    label: "Developer",
    can: ["Full access to the admin panel", "Manage users, roles and custom code"],
  },
};

export function buildInviteEmail(input: InviteEmailInput): { subject: string; html: string; text: string } {
  const business = input.businessName.trim() || "our team";
  const dark = pick(input.colors?.dark, "#1c120c");
  const accent = pick(input.colors?.accent, "#432516");
  const cream = pick(input.colors?.cream, "#f9f4ee");
  const gold = pick(input.colors?.gold, "#d99b26");
  const copy = ROLE_COPY[input.role] ?? ROLE_COPY.staff;

  const name = input.fullName?.trim();
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const inviter = input.invitedBy?.trim();
  const intro = inviter
    ? `${inviter} has invited you to help run ${business} online.`
    : `You've been invited to help run ${business} online.`;
  const subject = `You're invited to join ${business}`;

  const b = escapeHtml(business);
  const link = escapeHtml(input.inviteLink);
  const initial = escapeHtml(business.charAt(0).toUpperCase());
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const serif = "Georgia,'Times New Roman',serif";

  const list = copy.can
    .map(
      (item) => `
              <tr>
                <td width="26" valign="top" style="padding:6px 0;font-size:16px;line-height:20px;color:${gold};">&#10003;</td>
                <td style="padding:6px 0;font-family:${font};font-size:15px;line-height:22px;color:#44403c;">${escapeHtml(item)}</td>
              </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${cream};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(intro)} Set up your account in one minute.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${cream};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td align="center" style="background:${dark};border-radius:20px 20px 0 0;padding:36px 24px 30px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" width="56" height="56" style="width:56px;height:56px;border-radius:28px;background:${gold};color:${dark};font-family:${serif};font-size:26px;font-weight:bold;line-height:56px;">${initial}</td>
              </tr>
            </table>
            <p style="margin:16px 0 0;font-family:${serif};font-size:24px;line-height:30px;font-weight:bold;color:#ffffff;">${b}</p>
            <p style="margin:6px 0 0;font-family:${font};font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${gold};">Team invitation</p>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:36px 32px 12px;">
            <h1 style="margin:0 0 14px;font-family:${serif};font-size:26px;line-height:32px;color:${dark};">Welcome aboard</h1>
            <p style="margin:0 0 12px;font-family:${font};font-size:16px;line-height:25px;color:#292524;">${escapeHtml(greeting)}</p>
            <p style="margin:0 0 18px;font-family:${font};font-size:16px;line-height:25px;color:#44403c;">${escapeHtml(intro)} You'll join as <strong style="color:${dark};">${escapeHtml(copy.label)}</strong>. Press the button to choose your password and sign in.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="background:#ffffff;padding:6px 32px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="${accent}" style="border-radius:999px;">
                  <a href="${link}" target="_blank" style="display:inline-block;padding:15px 36px;font-family:${font};font-size:16px;font-weight:bold;line-height:20px;color:#ffffff;text-decoration:none;border-radius:999px;background:${accent};">Set up my account</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:26px 32px 8px;">
            <p style="margin:0 0 6px;font-family:${font};font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#a8a29e;">What you'll be able to do</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${list}
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:20px 32px 34px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf8f5;border-radius:12px;">
              <tr>
                <td style="padding:16px 18px;font-family:${font};font-size:13px;line-height:20px;color:#78716c;">
                  Button not working? Copy this link into your browser:<br>
                  <a href="${link}" target="_blank" style="color:${accent};word-break:break-all;">${link}</a>
                </td>
              </tr>
            </table>
            <p style="margin:18px 0 0;font-family:${font};font-size:13px;line-height:20px;color:#78716c;">This invitation is just for you, so please don't forward it. The link stops working after a while; if it has expired, ask whoever invited you to send a new one.</p>
          </td>
        </tr>
        <tr>
          <td align="center" style="background:${dark};border-radius:0 0 20px 20px;padding:22px 24px;">
            <p style="margin:0;font-family:${font};font-size:12px;line-height:19px;color:#d6d3d1;">Didn't expect this email? You can safely ignore it &mdash; nothing happens until the button is used.</p>
            <p style="margin:8px 0 0;font-family:${font};font-size:12px;color:#a8a29e;">&copy; ${b}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    `${business} — team invitation`,
    "",
    greeting,
    "",
    `${intro} You'll join as ${copy.label}.`,
    "",
    "Set up your account (choose a password and sign in):",
    input.inviteLink,
    "",
    "What you'll be able to do:",
    ...copy.can.map((c) => `  - ${c}`),
    "",
    "This invitation is just for you, so please don't forward it. If the link has expired, ask whoever invited you for a new one.",
    "Didn't expect this email? You can safely ignore it.",
  ].join("\n");

  return { subject, html, text };
}
