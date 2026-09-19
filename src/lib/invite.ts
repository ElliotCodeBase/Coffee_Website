import { createAdminClient } from "@/lib/supabase/server";
import { classifyInviteError } from "@/lib/auth-errors";
import type { UserRole } from "@/types/database";

/* Shared by the Team page (addTeamMember) and the Developer page
   (inviteUser) so both invite paths behave identically. Server-only:
   it uses the service-role client. Not a "use server" file on purpose —
   it must not be callable from the browser as an action. */

export type InviteOutcome =
  | { ok: true; userId: string; emailSent: true }
  | { ok: true; userId: string; emailSent: false; inviteLink: string; reason: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

export function normalizeName(raw: string): string | null {
  /* eslint-disable-next-line no-control-regex */
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 120);
  return cleaned || null;
}

export async function inviteTeamUser(input: {
  email: string;
  fullName: string | null;
  role: UserRole;
}): Promise<InviteOutcome> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("inviteTeamUser: admin client unavailable:", err instanceof Error ? err.message : err);
    return {
      ok: false,
      error:
        "The server isn't configured to manage accounts. Set SUPABASE_SERVICE_ROLE_KEY (the service_role secret, not the anon key) in your hosting environment and redeploy.",
    };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const redirectTo = `${siteUrl}/admin/set-password`;
  const metadata = input.fullName ? { full_name: input.fullName } : undefined;

  let userId: string | null = null;
  let inviteLink: string | null = null;
  let deliveryReason = "";

  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, { redirectTo, data: metadata });

  if (!error && data?.user) {
    userId = data.user.id;
  } else {
    const failure = classifyInviteError(error);
    /* Log the REAL error server-side (visible in Vercel / hosting logs). */
    console.error("inviteTeamUser: inviteUserByEmail failed", {
      code: error?.code,
      status: error?.status,
      message: error?.message,
      kind: failure.kind,
    });

    if (failure.kind !== "email_delivery") return { ok: false, error: failure.message };

    /* The account can be created but the email can't be sent. Rather than
       leaving the admin stuck, create the invite without sending mail and
       hand the link back so they can deliver it themselves. */
    const link = await admin.auth.admin.generateLink({
      type: "invite",
      email: input.email,
      options: { redirectTo, data: metadata },
    });
    const actionLink: string | undefined = link.data?.properties?.action_link;
    if (link.error || !link.data?.user || !actionLink) {
      console.error("inviteTeamUser: generateLink fallback failed", { code: link.error?.code, message: link.error?.message });
      return { ok: false, error: failure.message };
    }
    userId = link.data.user.id;
    inviteLink = actionLink;
    deliveryReason = failure.message;
  }

  if (!userId) {
    /* Unreachable in practice (every success path sets it) but keeps the
       type honest and fails safe instead of writing a profile for "null". */
    return { ok: false, error: "Supabase did not return an account ID for that invite. Please try again." };
  }

  /* Never downgrade a developer or the Main Admin by re-inviting them. */
  const { data: existing } = await admin.from("profiles").select("role, is_main_admin").eq("id", userId).maybeSingle();
  const protectedAccount = existing?.role === "developer" || existing?.is_main_admin === true;

  /* upsert, not update: if the auth.users trigger ever fails to create the
     profile row, a plain UPDATE would match zero rows, report success, and
     leave an account with no role. */
  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      protectedAccount ? { id: userId, full_name: input.fullName } : { id: userId, role: input.role, full_name: input.fullName },
      { onConflict: "id" }
    );

  if (profileError) {
    console.error("inviteTeamUser: profile upsert failed:", profileError.message);
    return { ok: false, error: "The invite was created, but setting the account's permissions failed. Check the profiles table in Supabase." };
  }

  return inviteLink
    ? { ok: true, userId, emailSent: false, inviteLink, reason: deliveryReason }
    : { ok: true, userId, emailSent: true };
}
