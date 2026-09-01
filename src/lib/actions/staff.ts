"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Staff-account management is available to admin (the client) and
 * developer (the agency) — never to staff accounts themselves.
 * This mirrors assertDeveloper() in developer.ts but allows both
 * privileged roles rather than developer only.
 */
async function assertCanManageStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "developer") return { ok: false as const };

  return { ok: true as const, userId: user.id };
}

/**
 * Creates a new staff-only account. Uses the SERVICE ROLE key so the
 * new profile can be force-set to role "staff" regardless of RLS —
 * this action never accepts a role from the caller, so it can only
 * ever create staff accounts, nothing more privileged.
 */
export async function addStaffMember(formData: FormData): Promise<ActionResult> {
  const check = await assertCanManageStaff();
  if (!check.ok) return { error: "You don't have permission to manage staff." };

  const email = String(formData.get("email") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  if (!email) return { error: "Email is required." };

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/admin/set-password`,
  });

  if (error || !data.user) {
    console.error("addStaffMember invite error:", error?.message);
    return { error: error?.message || "Failed to send invite." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "staff", full_name: fullName || null })
    .eq("id", data.user.id);

  if (profileError) {
    console.error("addStaffMember profile error:", profileError.message);
    return { error: "Invite sent, but failed to set staff permissions. Ask a developer to check the account." };
  }

  revalidatePath("/admin/staff");
  return { success: true };
}

/**
 * Removes a staff account. Refuses to touch any account that isn't
 * currently role "staff" — this endpoint can never be used to delete
 * an admin or developer account, even if a userId is tampered with
 * client-side.
 */
export async function removeStaffMember(userId: string): Promise<ActionResult> {
  const check = await assertCanManageStaff();
  if (!check.ok) return { error: "You don't have permission to manage staff." };

  const admin = createAdminClient();

  const { data: targetProfile } = await admin.from("profiles").select("role").eq("id", userId).single();
  if (targetProfile?.role !== "staff") {
    return { error: "This tool can only remove staff accounts." };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("removeStaffMember error:", error.message);
    return { error: "Failed to remove staff account." };
  }

  revalidatePath("/admin/staff");
  return { success: true };
}
