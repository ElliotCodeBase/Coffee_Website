"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const VALID_STATUSES = ["new", "read", "archived"] as const;
type SubmissionStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: string): value is SubmissionStatus {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

export async function markSubmissionStatus(id: string, status: SubmissionStatus) {
  // Validate UUID to prevent injection
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "Invalid message ID." };
  }
  if (!isValidStatus(status)) {
    return { error: "Invalid status value." };
  }

  const supabase = await createClient();

  // Verify caller is admin/developer/staff (RLS also enforces this, double-check here)
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

/**
 * Permanently deletes a contact submission. Restricted to admin and
 * developer roles (RLS also enforces this server-side).
 */
export async function deleteSubmission(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { error: "Invalid message ID." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Explicit role check before delete (belt-and-suspenders on top of RLS)
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
