"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

const MAX_LABEL_LENGTH = 80;
/* Same character set as the rest of the app's slugs (menu categories,
   legal page slugs) — lowercase letters, numbers, and hyphens only. Kept
   strict because this id is stored in contact_submissions.topic and used
   to build the email subject/label, so it should never contain anything
   that needs escaping. */
const ID_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

async function assertCanEditTopics() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, supabase };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "developer") return { ok: false as const, supabase };

  return { ok: true as const, supabase };
}

function revalidateTopics() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/site-info");
}

export async function createContactTopic(id: string, label: string): Promise<ActionResult> {
  const check = await assertCanEditTopics();
  if (!check.ok) return { error: "You do not have permission to edit contact topics." };

  const cleanId = id.trim().toLowerCase();
  const cleanLabel = label.trim();

  if (!ID_RE.test(cleanId)) {
    return { error: "The id must be lowercase letters, numbers and hyphens only (e.g. \"catering\")." };
  }
  if (!cleanLabel) return { error: "Label is required." };
  if (cleanLabel.length > MAX_LABEL_LENGTH) return { error: `Label is too long (maximum ${MAX_LABEL_LENGTH} characters).` };

  const { count } = await check.supabase.from("contact_topics").select("id", { count: "exact", head: true });
  const { error } = await check.supabase.from("contact_topics").insert({ id: cleanId, label: cleanLabel, sort_order: count ?? 0 });

  if (error) {
    if (error.message.includes("duplicate")) return { error: "That id is already used by another topic." };
    console.error("createContactTopic error:", error.message);
    return { error: "Failed to add topic." };
  }

  revalidateTopics();
  return { success: true };
}

export async function updateContactTopic(id: string, label: string): Promise<ActionResult> {
  const check = await assertCanEditTopics();
  if (!check.ok) return { error: "You do not have permission to edit contact topics." };

  const cleanLabel = label.trim();
  if (!cleanLabel) return { error: "Label is required." };
  if (cleanLabel.length > MAX_LABEL_LENGTH) return { error: `Label is too long (maximum ${MAX_LABEL_LENGTH} characters).` };

  const { error } = await check.supabase.from("contact_topics").update({ label: cleanLabel }).eq("id", id);
  if (error) {
    console.error("updateContactTopic error:", error.message);
    return { error: "Failed to save topic." };
  }

  revalidateTopics();
  return { success: true };
}

export async function deleteContactTopic(id: string): Promise<ActionResult> {
  const check = await assertCanEditTopics();
  if (!check.ok) return { error: "You do not have permission to edit contact topics." };

  const { count } = await check.supabase.from("contact_topics").select("id", { count: "exact", head: true });
  if ((count ?? 0) <= 1) {
    return { error: "At least one topic must remain — the contact form needs something to show." };
  }

  const { error } = await check.supabase.from("contact_topics").delete().eq("id", id);
  if (error) {
    console.error("deleteContactTopic error:", error.message);
    return { error: "Failed to delete topic." };
  }

  // Existing messages that used this topic keep the old id as plain text
  // (contact_submissions.topic has no foreign key) — they just won't match
  // a current topic's label anymore, same as any deleted category elsewhere
  // in the app.
  revalidateTopics();
  return { success: true };
}

export async function moveContactTopic(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const check = await assertCanEditTopics();
  if (!check.ok) return { error: "You do not have permission to edit contact topics." };

  const { data: topics, error: fetchError } = await check.supabase
    .from("contact_topics")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (fetchError || !topics) return { error: "Failed to load topics." };

  const index = topics.findIndex((t) => t.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= topics.length) return { success: true }; // already at the edge

  const a = topics[index];
  const b = topics[swapIndex];

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    check.supabase.from("contact_topics").update({ sort_order: b.sort_order }).eq("id", a.id),
    check.supabase.from("contact_topics").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);

  if (e1 || e2) {
    console.error("moveContactTopic error:", e1?.message || e2?.message);
    return { error: "Failed to reorder topics." };
  }

  revalidateTopics();
  return { success: true };
}
