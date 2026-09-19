"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { inviteTeamUser, normalizeEmail, normalizeName } from "@/lib/invite";
import type { UserRole } from "@/types/database";

export interface ActionResult {
  success?: boolean;
  error?: string;
  /** Set when the invite could not be emailed; the admin delivers it by hand. */
  inviteLink?: string;
  /** Why the email could not be sent (shown next to inviteLink). */
  notice?: string;
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
  if (!check.ok) return { error: "You do not have permission to manage the team." };

  const rawEmail = String(formData.get("email") || "");
  if (!rawEmail.trim()) return { error: "Email is required." };
  const email = normalizeEmail(rawEmail);
  if (!email) return { error: "Enter a valid email address." };

  const fullName = normalizeName(String(formData.get("full_name") || ""));
  const requestedRole = String(formData.get("role") || "staff");
  const role = isAssignableRole(requestedRole) ? requestedRole : "staff";

  const outcome = await inviteTeamUser({ email, fullName, role });
  if (!outcome.ok) return { error: outcome.error };

  revalidatePath("/admin/staff");
  return outcome.emailSent
    ? { success: true }
    : { success: true, inviteLink: outcome.inviteLink, notice: outcome.reason };
}

export async function removeTeamMember(userId: string): Promise<ActionResult> {
  /* Validate the ID format before using it in a query. */
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return { error: "Invalid user ID." };
  }

  const check = await assertCanManageTeam();
  if (!check.ok) return { error: "You do not have permission to manage the team." };

  if (userId === check.userId) {
    return { error: "You cannot remove your own account here." };
  }

  /* Use the admin client to read the target profile. This bypasses Row
     Level Security so the function can read any profile row reliably. */
  const admin = createAdminClient();

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role, is_main_admin")
    .eq("id", userId)
    .single();

  if (!targetProfile || !isAssignableRole(targetProfile.role)) {
    return { error: "This tool can only remove admin or staff accounts." };
  }

  /* Do not allow the main admin to be deleted. The user must transfer
     the main admin role to another account first. */
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

/* Transfer the Main Admin designation from the current main admin to
   another admin-role user. Only the current main admin can call this.
   After the transfer, the original main admin becomes a regular admin. */
export async function transferMainAdmin(newMainAdminId: string): Promise<ActionResult> {
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

  /* Confirm the target user has the admin role. */
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", newMainAdminId)
    .single();

  if (!targetProfile || targetProfile.role !== "admin") {
    return { error: "The Main Admin role can only be transferred to another admin account." };
  }

  /* Two separate requests can't be made atomic from here, and a unique
     partial index allows only ONE main admin. The old code ran both
     updates in parallel: if "set new = true" landed first it hit the
     unique index and failed while "set old = false" still succeeded —
     leaving the site with NO main admin. Run them in order instead
     (release first, then claim) and roll back if the claim fails. */
  const { error: releaseError } = await admin.from("profiles").update({ is_main_admin: false }).eq("id", user.id);
  if (releaseError) {
    console.error("transferMainAdmin release error:", releaseError.message);
    return { error: "Transfer failed. Nothing was changed." };
  }

  const { error: claimError } = await admin.from("profiles").update({ is_main_admin: true }).eq("id", newMainAdminId);
  if (claimError) {
    console.error("transferMainAdmin claim error:", claimError.message);
    const { error: rollbackError } = await admin.from("profiles").update({ is_main_admin: true }).eq("id", user.id);
    if (rollbackError) {
      console.error("transferMainAdmin ROLLBACK FAILED — no main admin is set:", rollbackError.message);
      return {
        error:
          "Transfer failed and the previous Main Admin could not be restored automatically. Run: update public.profiles set is_main_admin = true where id = '" +
          user.id +
          "';",
      };
    }
    return { error: "Transfer failed. Nothing was changed." };
  }

  revalidatePath("/admin/staff");
  return { success: true };
}
