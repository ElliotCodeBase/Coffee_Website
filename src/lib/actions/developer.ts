"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { inviteTeamUser, normalizeEmail } from "@/lib/invite";
import { isHexColor } from "@/lib/theme-sanitize";
import { isFontPairingKey } from "@/lib/theme-presets";
import { clampDuration, cleanLabel, isLoaderFrequency, LOADER_MAX_MS, LOADER_MIN_MS } from "@/lib/loader-config";
import type { UserRole } from "@/types/database";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALL_ROLES: readonly UserRole[] = ["admin", "developer", "staff"];
const SNIPPET_LOCATIONS = ["head", "body_start", "body_end"] as const;
const MAX_SNIPPET_CHARS = 100_000;

export interface ActionResult {
  success?: boolean;
  error?: string;
  /** Set when the invite email could not be sent; deliver this link by hand. */
  inviteLink?: string;
  notice?: string;
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

/* Theme & Colors is an Admin Panel feature (business owner + developer),
   unlike the rest of this file which is developer-only. Staff cannot
   reach it — enforced here and again by theme_settings' RLS policy. */
async function assertCanEditTheme() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, supabase };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "developer") return { ok: false as const, supabase };

  return { ok: true as const, supabase, userId: user.id };
}

export async function updateTheme(formData: FormData): Promise<ActionResult> {
  const check = await assertCanEditTheme();
  if (!check.ok) return { error: "You do not have permission to edit the theme." };

  /* Colors are written into a <style> block on every public page, so only
     strict hex values are accepted. Fonts are a curated pairing key, not
     free text — see src/lib/theme-presets.ts for why. */
  const colorFields = ["color_dark", "color_card", "color_cream", "color_tan", "color_accent", "color_gold", "color_drip"] as const;
  const values: Record<string, string> = {};
  for (const f of colorFields) {
    const v = String(formData.get(f) ?? "").trim();
    if (!isHexColor(v)) return { error: `${f.replace(/_/g, " ")} must be a hex color like #1c120c.` };
    values[f] = v;
  }

  const fontPairing = String(formData.get("font_pairing") ?? "").trim();
  if (!isFontPairingKey(fontPairing)) return { error: "Choose one of the listed font pairings." };
  values.font_pairing = fontPairing;

  const { data: updated, error } = await check.supabase
    .from("theme_settings")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("id");

  if (error) {
    console.error("updateTheme error:", error.message);
    return { error: "Failed to save theme." };
  }
  // RLS can "succeed" while changing nothing; never report that as saved.
  if (!updated || updated.length === 0) {
    return { error: "Nothing was saved — your account may not be allowed to edit the theme." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/theme");
  return { success: true };
}

/* Loading animation options are saved on their own (not together with colors
   and fonts) so a problem in one form can never silently block the other.
   The row is read back after saving, so "Saved" only ever means "it is in
   the database". */
export async function updateLoaderSettings(formData: FormData): Promise<ActionResult> {
  const check = await assertCanEditTheme();
  if (!check.ok) return { error: "You do not have permission to edit the loading animation." };

  const rawSecs = Number(formData.get("loader_seconds"));
  const rawMs = Math.round(rawSecs * 1000);
  if (!Number.isFinite(rawSecs) || rawMs < LOADER_MIN_MS || rawMs > LOADER_MAX_MS) {
    return { error: `Length must be between ${LOADER_MIN_MS / 1000} and ${LOADER_MAX_MS / 1000} seconds.` };
  }
  const frequency = String(formData.get("loader_frequency") ?? "every");
  if (!isLoaderFrequency(frequency)) return { error: "Choose how often the loading animation shows." };

  const values = {
    loader_enabled: formData.get("loader_enabled") === "on",
    loader_duration_ms: clampDuration(rawMs),
    loader_frequency: frequency,
    loader_show_percent: formData.get("loader_show_percent") === "on",
    loader_label: cleanLabel(formData.get("loader_label")) || null,
  };

  const { data: updated, error } = await check.supabase
    .from("theme_settings")
    .update({ ...values, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("loader_enabled, loader_duration_ms, loader_frequency, loader_show_percent, loader_label");

  if (error) {
    console.error("updateLoaderSettings error:", error.message);
    if (error.code === "42703" || /loader_/.test(error.message)) {
      return { error: "The database is missing the loading-animation columns. Run supabase/migration_theme_loader.sql in the Supabase SQL Editor, then try again." };
    }
    return { error: "Failed to save the loading animation." };
  }
  const row = updated?.[0];
  if (!row) return { error: "Nothing was saved — your account may not be allowed to edit the theme." };
  if (row.loader_duration_ms !== values.loader_duration_ms || row.loader_enabled !== values.loader_enabled) {
    return { error: "The database did not keep your changes. Please try again." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/theme");
  return { success: true };
}

export async function createCodeSnippet(formData: FormData): Promise<ActionResult> {
  const check = await assertDeveloper();
  if (!check.ok || !("userId" in check)) return { error: "Developer access required." };

  const location = String(formData.get("location")) as "head" | "body_start" | "body_end";
  const code = String(formData.get("code") || "");

  if (!SNIPPET_LOCATIONS.includes(location)) {
    return { error: "Invalid injection location." };
  }
  if (code.length > MAX_SNIPPET_CHARS) return { error: "That snippet is too large." };

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
  if (!UUID_RE.test(id)) return { error: "Invalid snippet." };
  const check = await assertDeveloper();
  if (!check.ok || !("userId" in check)) return { error: "Developer access required." };

  const location = String(formData.get("location")) as "head" | "body_start" | "body_end";
  const code = String(formData.get("code") || "");
  if (!SNIPPET_LOCATIONS.includes(location)) return { error: "Invalid injection location." };
  if (code.length > MAX_SNIPPET_CHARS) return { error: "That snippet is too large." };

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
  if (!UUID_RE.test(id)) return { error: "Invalid snippet." };
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

/* Invite a new user by email (developer-only). Uses the same helper as the
   Team page so both paths behave identically, including the manual-link
   fallback when Supabase can't send the email. New users start as "staff";
   change the role afterwards with updateUserRole. */
export async function inviteUser(formData: FormData): Promise<ActionResult> {
  const check = await assertDeveloper();
  if (!check.ok) return { error: "Developer access required." };

  const rawEmail = String(formData.get("email") || "");
  if (!rawEmail.trim()) return { error: "Email is required." };
  const email = normalizeEmail(rawEmail);
  if (!email) return { error: "Enter a valid email address." };

  const outcome = await inviteTeamUser({ email, fullName: null, role: "staff" });
  if (!outcome.ok) return { error: outcome.error };

  revalidatePath("/admin/developer/users");
  return outcome.emailSent
    ? { success: true }
    : { success: true, inviteLink: outcome.inviteLink, notice: outcome.reason };
}

/* Change a user's role.
   The profiles table deliberately has NO update policy (users must never
   be able to promote themselves), so the previous version — which wrote
   through the caller's own session — matched zero rows and reported
   "success" while changing nothing. The developer check above is the
   authorization; the write itself uses the service-role client and
   verifies that a row actually changed. */
export async function updateUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  if (!UUID_RE.test(userId)) return { error: "Invalid user ID." };
  if (!ALL_ROLES.includes(role)) return { error: "Invalid role." };

  const check = await assertDeveloper();
  if (!check.ok || !("userId" in check)) return { error: "Developer access required." };
  if (userId === check.userId) return { error: "You cannot change your own role." };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("updateUserRole: admin client unavailable:", err instanceof Error ? err.message : err);
    return { error: "The server isn't configured to manage accounts (missing service role key)." };
  }

  const { data: target } = await admin.from("profiles").select("role, is_main_admin").eq("id", userId).maybeSingle();
  if (!target) return { error: "That account was not found." };
  if (target.is_main_admin && role !== "admin") {
    return { error: "The Main Admin must stay an admin. Transfer the Main Admin role first." };
  }

  const { data, error } = await admin.from("profiles").update({ role }).eq("id", userId).select("id");
  if (error) {
    console.error("updateUserRole error:", error.message);
    return { error: "Failed to update role." };
  }
  if (!data || data.length === 0) return { error: "No account was updated." };

  revalidatePath("/admin/developer/users");
  revalidatePath("/admin/staff");
  return { success: true };
}

export async function removeUser(userId: string): Promise<ActionResult> {
  if (!UUID_RE.test(userId)) return { error: "Invalid user ID." };

  const check = await assertDeveloper();
  if (!check.ok || !("userId" in check)) return { error: "Developer access required." };

  if (userId === check.userId) {
    return { error: "You cannot remove your own account." };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("removeUser: admin client unavailable:", err instanceof Error ? err.message : err);
    return { error: "The server isn't configured to manage accounts (missing service role key)." };
  }

  /* Same rule the Team page enforces: the Main Admin can't be deleted. */
  const { data: target } = await admin.from("profiles").select("is_main_admin").eq("id", userId).maybeSingle();
  if (target?.is_main_admin) {
    return { error: "This is the Main Admin account. Transfer the Main Admin role to another admin first." };
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("removeUser error:", error.message);
    return { error: "Failed to remove user." };
  }

  revalidatePath("/admin/developer/users");
  revalidatePath("/admin/staff");
  return { success: true };
}
