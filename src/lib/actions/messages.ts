"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_STATUSES = ["new", "read", "archived"] as const;
type SubmissionStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: string): value is SubmissionStatus {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

export async function markSubmissionStatus(id: string, status: SubmissionStatus) {
  /* Validate the ID format to prevent injection attacks. */
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "Invalid message ID." };
  }
  if (!isValidStatus(status)) {
    return { error: "Invalid status value." };
  }

  const supabase = await createClient();

  /* Verify the caller is authenticated. Row Level Security also enforces
     this, but checking here returns a clear error message. */
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("contact_submissions").update({ status }).eq("id", id);
  if (error) {
    console.error("markSubmissionStatus error:", error.message);
    return { error: "Failed to update message." };
  }
  revalidatePath("/admin/messages");
  return { success: true };
}

/* Permanently delete a contact submission.
   Only admin and developer roles can do this. Row Level Security also
   enforces this on the server side. */
export async function deleteSubmission(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "Invalid message ID." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  /* Check the role explicitly. Row Level Security also enforces this. */
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "developer") {
    return { error: "Only admins can delete messages." };
  }

  const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
  if (error) {
    console.error("deleteSubmission error:", error.message);
    return { error: "Failed to delete message." };
  }
  revalidatePath("/admin/messages");
  return { success: true };
}

/* ---------- Bulk actions (select several / delete everything) ---------- */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BULK = 500;

function cleanIds(ids: unknown): string[] | null {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_BULK) return null;
  const unique = Array.from(new Set(ids.map(String)));
  return unique.every((id) => UUID_RE.test(id)) ? unique : null;
}

async function requireRole(allowed: readonly string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not authenticated." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !allowed.includes(profile.role)) return { ok: false as const, error: "You do not have permission to do that." };
  return { ok: true as const, supabase };
}

/* Mark several messages read / archived / new in one go. */
export async function bulkSetSubmissionStatus(ids: string[], status: SubmissionStatus) {
  const clean = cleanIds(ids);
  if (!clean) return { error: `Select between 1 and ${MAX_BULK} messages.` };
  if (!isValidStatus(status)) return { error: "Invalid status value." };

  const check = await requireRole(["admin", "developer", "staff"]);
  if (!check.ok) return { error: check.error };

  const { error } = await check.supabase.from("contact_submissions").update({ status }).in("id", clean);
  if (error) {
    console.error("bulkSetSubmissionStatus error:", error.message);
    return { error: "Failed to update the selected messages." };
  }
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}

/* Permanently delete several messages. Admin and developer only (RLS agrees). */
export async function bulkDeleteSubmissions(ids: string[]) {
  const clean = cleanIds(ids);
  if (!clean) return { error: `Select between 1 and ${MAX_BULK} messages.` };

  const check = await requireRole(["admin", "developer"]);
  if (!check.ok) return { error: check.error };

  const { error } = await check.supabase.from("contact_submissions").delete().in("id", clean);
  if (error) {
    console.error("bulkDeleteSubmissions error:", error.message);
    return { error: "Failed to delete the selected messages." };
  }
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}

/* Delete EVERY message. Admin and developer only. */
export async function deleteAllSubmissions() {
  const check = await requireRole(["admin", "developer"]);
  if (!check.ok) return { error: check.error };

  // PostgREST refuses a delete with no filter; "id is not null" matches every row.
  const { error } = await check.supabase.from("contact_submissions").delete().not("id", "is", null);
  if (error) {
    console.error("deleteAllSubmissions error:", error.message);
    return { error: "Failed to delete all messages." };
  }
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}
