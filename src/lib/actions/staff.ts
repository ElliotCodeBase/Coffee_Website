"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/types/database";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

const ASSIGNABLE_ROLES: readonly UserRole[] = ["admin", "staff"];

function isAssignableRole(value: string): value is UserRole {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(value);
}

async function assertCanManageTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const { data: profile } = await supabase.from("profiles").select("role, is_main_admin").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "developer") return { ok: false as const };

  return { ok: true as const, userId: user.id, isMainAdmin: profile?.is_main_admin ?? false };
}

export async function addTeamMember(formData: FormData): Promise<ActionResult> {
  const check = await assertCanManageTeam();
  if (!check.ok) return { error: "You don't have permission to manage the team." };

  const email = String(formData.get("email") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  const requestedRole = String(formData.get("role") || "staff");
  const role = isAssignableRole(requestedRole) ? requestedRole : "staff";

  if (!email) return { error: "Email is required." };
  // Basic email format validation server-side
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please provide a valid email address." };

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/admin/set-password`,
  });

  if (error || !data.user) {
    console.error("addTeamMember invite error:", error?.message);
    return { error: "Failed to send invite. The email may already be in use." };
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

export async function removeTeamMember(userId: string): Promise<ActionResult> {
  // Validate userId is a UUID to prevent injection
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return { error: "Invalid user ID." };
  }

  const check = await assertCanManageTeam();
  if (!check.ok) return { error: "You don't have permission to manage the team." };

  if (userId === check.userId) {
    return { error: "You can't remove your own account here." };
  }

  const admin = createAdminClient();

  // Use admin client to bypass RLS so we can reliably read any profile row.
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role, is_main_admin")
    .eq("id", userId)
    .single();

  if (!targetProfile || !isAssignableRole(targetProfile.role)) {
    return { error: "This tool can only remove admin or staff accounts." };
  }

  // Protect the main admin from deletion unless ownership is transferred first.
  if (targetProfile.is_main_admin) {
    return {
      error:
        "This is the Main Admin account and cannot be deleted. Transfer the Main Admin role to another admin first.",
    };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("removeTeamMember error:", error.message);
    return { error: "Failed to remove account." };
  }

  revalidatePath("/admin/staff");
  return { success: true };
}

/**
 * Transfers the "Main Admin" designation from the current main admin to
 * another admin-role user. Only the current main admin can call this.
 * After transfer, the original main admin becomes a regular admin.
 */
export async function transferMainAdmin(newMainAdminId: string): Promise<ActionResult> {
  // Validate UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newMainAdminId)) {
    return { error: "Invalid user ID." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, is_main_admin")
    .eq("id", user.id)
    .single();

  if (!callerProfile?.is_main_admin) {
    return { error: "Only the current Main Admin can transfer this role." };
  }

  const admin = createAdminClient();

  // Verify the target is an admin-role user
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", newMainAdminId)
    .single();

  if (!targetProfile || targetProfile.role !== "admin") {
    return { error: "The Main Admin role can only be transferred to another admin account." };
  }

  // Clear main admin from current holder, set on new holder
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    admin.from("profiles").update({ is_main_admin: false }).eq("id", user.id),
    admin.from("profiles").update({ is_main_admin: true }).eq("id", newMainAdminId),
  ]);

  if (e1 || e2) {
    console.error("transferMainAdmin error:", e1?.message, e2?.message);
    return { error: "Transfer failed. Please try again." };
  }

  revalidatePath("/admin/staff");
  return { success: true };
}
