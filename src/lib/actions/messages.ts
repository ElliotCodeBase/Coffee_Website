"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markSubmissionStatus(id: string, status: "new" | "read" | "archived") {
  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").update({ status }).eq("id", id);
  if (error) {
    console.error("markSubmissionStatus error:", error.message);
    return { error: "Failed to update message." };
  }
  revalidatePath("/admin/messages");
  return { success: true };
}
