"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { STAFF_ALLOWED_PREFIXES, STAFF_LANDING } from "@/proxy";

export interface AuthResult {
  error?: string;
}

/**
 * Only ever allow redirecting back into the admin panel on this origin.
 * Rejects protocol-relative ("//evil.com"), absolute, and backslash-escaped
 * targets so a crafted ?redirectTo= can't turn the login page into an
 * open redirect.
 */
function safeRedirectTarget(raw: string): string | null {
  if (!raw.startsWith("/admin")) return null;
  if (raw.startsWith("//") || raw.includes("\\")) return null;
  if (raw === "/admin/login" || raw === "/admin/set-password") return null;
  return raw;
}

export async function login(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const requested = safeRedirectTarget(String(formData.get("redirectTo") || ""));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Don't leak whether the email exists — generic message only.
    return { error: "Invalid email or password." };
  }

  // Send the user somewhere they're actually allowed to be. Previously this
  // always hard-redirected to /admin, so a staff account logged in, got
  // bounced by the proxy to /admin/menu, and any deep link they'd been
  // redirected away from was thrown away.
  let destination = requested ?? "/admin";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (
    profile?.role === "staff" &&
    !STAFF_ALLOWED_PREFIXES.some((prefix) => destination.startsWith(prefix))
  ) {
    destination = STAFF_LANDING;
  }

  redirect(destination);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/**
 * Lets any logged-in admin panel user (admin, developer, or staff)
 * change their own password. Re-verifies the current password first —
 * this is a deliberate extra step so an unattended, already-logged-in
 * browser session can't be used to silently take over the account.
 */
export async function changeOwnPassword(formData: FormData): Promise<AuthResult> {
  const currentPassword = String(formData.get("current_password") || "");
  const newPassword = String(formData.get("new_password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!currentPassword || !newPassword) {
    return { error: "All fields are required." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword === currentPassword) {
    return { error: "Your new password must be different from your current one." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "You must be logged in." };
  }

  // Re-verify the current password before allowing the change.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return { error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    // Don't surface raw provider errors to the browser.
    console.error("changeOwnPassword error:", updateError.message);
    return { error: "Failed to update password. Please try again." };
  }

  return {};
}
