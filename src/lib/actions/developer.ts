"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/types/database";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

async function assertDeveloper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, supabase };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "developer") return { ok: false as const, supabase };

  return { ok: true as const, supabase, userId: user.id };
}

export async function updateTheme(formData: FormData): Promise<ActionResult> {
  const check = await assertDeveloper();
  if (!check.ok) return { error: "Developer access required." };

  const { error } = await check.supabase
    .from("theme_settings")
    .update({
      color_dark: String(formData.get("color_dark")),
      color_card: String(formData.get("color_card")),
      color_cream: String(formData.get("color_cream")),
      color_tan: String(formData.get("color_tan")),
      color_accent: String(formData.get("color_accent")),
      color_gold: String(formData.get("color_gold")),
      font_heading: String(formData.get("font_heading")),
      font_body: String(formData.get("font_body")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error("updateTheme error:", error.message);
    return { error: "Failed to save theme." };
  }

  revalidatePath("/");
  revalidatePath("/admin/developer/theme");
  return { success: true };
}

export async function createCodeSnippet(formData: FormData): Promise<ActionResult> {
  const check = await assertDeveloper();
  if (!check.ok || !("userId" in check)) return { error: "Developer access required." };

  const location = String(formData.get("location")) as "head" | "body_start" | "body_end";
  const code = String(formData.get("code") || "");

  if (!["head", "body_start", "body_end"].includes(location)) {
    return { error: "Invalid injection location." };
  }

  const { error } = await check.supabase.from("custom_code_snippets").insert([
    {
      location,
      label: String(formData.get("label") || "") || null,
      code,
      is_active: formData.get("is_active") === "on",
      updated_by: check.userId,
    },
  ]);

  if (error) {
    console.error("createCodeSnippet error:", error.message);
    return { error: "Failed to save snippet." };
  }

  revalidatePath("/");
  revalidatePath("/admin/developer/code");
  return { success: true };
}

export async function updateCodeSnippet(id: string, formData: FormData): Promise<ActionResult> {
  const check = await assertDeveloper();
  if (!check.ok || !("userId" in check)) return { error: "Developer access required." };

  const location = String(formData.get("location")) as "head" | "body_start" | "body_end";
  const code = String(formData.get("code") || "");

  const { error } = await check.supabase
    .from("custom_code_snippets")
    .update({
      location,
      label: String(formData.get("label") || "") || null,
      code,
      is_active: formData.get("is_active") === "on",
      updated_by: check.userId,
    })
    .eq("id", id);

  if (error) {
    console.error("updateCodeSnippet error:", error.message);
    return { error: "Failed to update snippet." };
  }

  revalidatePath("/");
  revalidatePath("/admin/developer/code");
  return { success: true };
}

export async function deleteCodeSnippet(id: string): Promise<ActionResult> {
  const check = await assertDeveloper();
  if (!check.ok) return { error: "Developer access required." };

  const { error } = await check.supabase.from("custom_code_snippets").delete().eq("id", id);
  if (error) {
    console.error("deleteCodeSnippet error:", error.message);
    return { error: "Failed to delete snippet." };
  }

  revalidatePath("/");
  revalidatePath("/admin/developer/code");
  return { success: true };
}

/**
 * Invite a new staff user by email (uses the SERVICE ROLE key — must stay
 * server-only). New users default to 'admin' role via the DB trigger;
 * developers can then promote them via updateUserRole below.
 */
export async function inviteUser(formData: FormData): Promise<ActionResult> {
  const check = await assertDeveloper();
  if (!check.ok) return { error: "Developer access required." };

  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Email is required." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email);

  if (error) {
    console.error("inviteUser error:", error.message);
    return { error: error.message || "Failed to send invite." };
  }

  revalidatePath("/admin/developer/users");
  return { success: true };
}

export async function updateUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  const check = await assertDeveloper();
  if (!check.ok) return { error: "Developer access required." };

  const { error } = await check.supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) {
    console.error("updateUserRole error:", error.message);
    return { error: "Failed to update role." };
  }

  revalidatePath("/admin/developer/users");
  return { success: true };
}

export async function removeUser(userId: string): Promise<ActionResult> {
  const check = await assertDeveloper();
  if (!check.ok || !("userId" in check)) return { error: "Developer access required." };

  if (userId === check.userId) {
    return { error: "You cannot remove your own account." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("removeUser error:", error.message);
    return { error: "Failed to remove user." };
  }

  revalidatePath("/admin/developer/users");
  return { success: true };
}
