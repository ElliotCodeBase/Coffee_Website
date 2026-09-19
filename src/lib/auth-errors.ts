/* Turn a raw Supabase Auth error into a specific, actionable message.

   Why this exists: the Team invite used to catch EVERY failure and show
   "The email address may already be in use." That hid the real cause —
   which is more often Supabase's built-in email limits, a missing service
   key, or a failing database trigger than a duplicate address. This file
   is deliberately pure (no server imports) so it can be unit-tested. */

export type AuthErrorLike = {
  code?: string | null;
  status?: number | null;
  message?: string | null;
  name?: string | null;
} | null | undefined;

export type InviteFailureKind =
  | "exists"          // a confirmed account already uses this address
  | "email_delivery"  // the account could be created, but the email can't be sent
  | "config"          // service-role key missing/wrong
  | "database"        // a DB trigger/constraint on auth.users failed
  | "invalid_email"
  | "unknown";

export interface InviteFailure {
  kind: InviteFailureKind;
  /** Shown to the admin in the UI. Never contains secrets. */
  message: string;
  /** Short machine reference so support can find it in Supabase → Logs → Auth. */
  ref: string;
}

export function classifyInviteError(error: AuthErrorLike): InviteFailure {
  const code = (error?.code || "").toLowerCase();
  const status = error?.status ?? 0;
  const text = (error?.message || "").toLowerCase();
  const ref = code || (status ? `http_${status}` : "unknown");

  if (code === "email_exists" || code === "user_already_exists" || text.includes("already been registered") || text.includes("already registered")) {
    return {
      kind: "exists",
      ref,
      message:
        "An activated account with this email already exists. If they can't sign in, remove the old account first, or ask them to use the email address they already registered with.",
    };
  }

  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || status === 429 || text.includes("rate limit")) {
    return {
      kind: "email_delivery",
      ref,
      message:
        "Supabase's built-in email service has hit its sending limit (about 2 emails per hour). Wait an hour, or connect a custom SMTP sender under Supabase → Authentication → SMTP Settings.",
    };
  }

  if (code === "email_address_not_authorized" || text.includes("not authorized")) {
    return {
      kind: "email_delivery",
      ref,
      message:
        "Supabase's built-in email service only delivers to addresses on your own Supabase team. Connect a custom SMTP sender (for example Resend) under Supabase → Authentication → SMTP Settings to email anyone.",
    };
  }

  if (text.includes("error sending") || text.includes("error inviting user") || text.includes("smtp") || text.includes("sending invite")) {
    return {
      kind: "email_delivery",
      ref,
      message:
        "The account was accepted but Supabase couldn't send the invite email. Check Supabase → Authentication → SMTP Settings (host, port, username, password, sender address).",
    };
  }

  if (code === "email_address_invalid" || code === "validation_failed" || text.includes("invalid format") || text.includes("unable to validate email")) {
    return { kind: "invalid_email", ref, message: "Supabase rejected that email address. Check it for typos." };
  }

  if (code === "not_admin" || code === "no_authorization" || status === 401 || status === 403 || text.includes("not allowed") || text.includes("invalid api key") || text.includes("jwt")) {
    return {
      kind: "config",
      ref,
      message:
        "The server couldn't authenticate to Supabase as an admin. Make sure SUPABASE_SERVICE_ROLE_KEY in your hosting environment is the service_role (secret) key — not the anon key — and redeploy.",
    };
  }

  if (text.includes("database error") || code === "unexpected_failure") {
    return {
      kind: "database",
      ref,
      message:
        "Supabase couldn't create the account because of a database error (usually a failing trigger or constraint on auth.users). See CHANGES.md → Troubleshooting → Team invite.",
    };
  }

  return {
    kind: "unknown",
    ref,
    message: `Supabase rejected the invite (reference: ${ref}). Look up that reference in Supabase → Logs → Auth for details.`,
  };
}
