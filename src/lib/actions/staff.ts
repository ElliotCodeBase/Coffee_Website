"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

// The only two roles this tool is allowed to hand out. Developer is
// never reachable here, no matter what a caller sends — that stays
// exclusive to the existing Users & Roles page.
const ASSIGNABLE_ROLES = new Set(["admin", "staff"]);

/**
 * Team-account management is available to admin (the client) and
 * developer (the agency) — never to staff accounts themselves.
 * This mirrors assertDeveloper() in developer.ts but allows both
 * privileged roles rather than developer only.
 */
async function assertCanManageTeam() {
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
 * Creates a new admin or staff account. Uses the SERVICE ROLE key so
 * the new profile can be force-set to the chosen role regardless of
 * RLS — the role is always checked against ASSIGNABLE_ROLES, so this
 * can never be used to create a developer account.
 */
export async function addTeamMember(formData: FormData): Promise<ActionResult> {
  const check = await assertCanManageTeam();
  if (!check.ok) return { error: "You don't have permission to manage the team." };

  const email = String(formData.get("email") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  const requestedRole = String(formData.get("role") || "staff");
  const role = ASSIGNABLE_ROLES.has(requestedRole) ? requestedRole : "staff";

  if (!email) return { error: "Email is required." };

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/admin/set-password`,
  });

  if (error || !data.user) {
    console.error("addTeamMember invite error:", error?.message);
    return { error: error?.message || "Failed to send invite." };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role, full_name: fullName || null })
    .eq("id", data.user.id);

  if (profileError) {
    console.error("addTeamMember profile error:", profileError.message);
    return { error: "Invite sent, but failed to set permissions. Ask a developer to check the account." };
  }

  revalidatePath("/admin/staff");
  return { success: true };
}

/**
 * Removes an admin or staff account. Refuses to touch any account
 * that isn't currently role "admin" or "staff" (developer accounts
 * can never be removed here), and refuses to let someone remove
 * their own account by mistake.
 */
export async function removeTeamMember(userId: string): Promise<ActionResult> {
  const check = await assertCanManageTeam();
  if (!check.ok) return { error: "You don't have permission to manage the team." };

  if (userId === check.userId) {
    return { error: "You can't remove your own account here." };
  }

  const admin = createAdminClient();

  const { data: targetProfile } = await admin.from("profiles").select("role").eq("id", userId).single();
  if (!targetProfile || !ASSIGNABLE_ROLES.has(targetProfile.role)) {
    return { error: "This tool can only remove admin or staff accounts." };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("removeTeamMember error:", error.message);
    return { error: "Failed to remove account." };
  }

  revalidatePath("/admin/staff");
  return { success: true };
}
