"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { STAFF_ALLOWED_PREFIXES, STAFF_LANDING } from "@/proxy";

export interface AuthResult {
  error?: string;
}

/* Validate a redirect target.
   The target must be a path inside /admin. Return null if the target
   is not safe to use. This function prevents an attacker from using a
   crafted ?redirectTo= parameter to redirect the user to an external site. */
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
    /* Use a generic message. Do not reveal whether the email address exists. */
    return { error: "Invalid email or password." };
  }

  /* Send the user to the requested page if it is safe to do so.
     Fall back to /admin if no destination is specified.
     If the user is a staff member, send them to a page they can access. */
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

/* Change the password for the current user.
   This function re-verifies the current password before making the change.
   This step prevents a silent takeover from an unattended browser session. */
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
    return { error: "New passwords do not match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "You must be logged in." };
  }

  /* Verify the current password before allowing the change. */
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return { error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    /* Log the raw error on the server. Do not send it to the browser. */
    console.error("changeOwnPassword error:", updateError.message);
    return { error: "Failed to update password. Please try again." };
  }

  return {};
}
