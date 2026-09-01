"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AuthResult {
  error?: string;
}

export async function login(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Don't leak whether the email exists — generic message only.
    return { error: "Invalid email or password." };
  }

  redirect("/admin");
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
    return { error: updateError.message || "Failed to update password." };
  }

  return {};
}
