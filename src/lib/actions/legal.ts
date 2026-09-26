"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LegalPageSlug } from "@/types/database";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

const SLUGS: readonly LegalPageSlug[] = ["terms", "privacy"];
const MAX_CONTENT_LENGTH = 20000;
const MAX_TITLE_LENGTH = 120;

/* Admin-panel feature, deliberately unavailable to staff: only admin and
   developer accounts may edit the Terms/Privacy pages. Row Level Security
   (see supabase/migration_add_legal_pages.sql) enforces the same rule at
   the database level as a second check. */
async function assertCanEditLegal(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "developer") return { ok: false as const };

  return { ok: true as const, userId: user.id };
}

export async function updateLegalPage(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const check = await assertCanEditLegal(supabase);
  if (!check.ok) return { error: "You do not have permission to edit legal pages." };

  const slugRaw = String(formData.get("slug") || "");
  if (!SLUGS.includes(slugRaw as LegalPageSlug)) return { error: "Invalid page." };
  const slug = slugRaw as LegalPageSlug;

  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();

  if (!title) return { error: "Title is required." };
  if (title.length > MAX_TITLE_LENGTH) return { error: `Title is too long (maximum ${MAX_TITLE_LENGTH} characters).` };
  if (content.length > MAX_CONTENT_LENGTH) {
    return { error: `That page is too long (maximum ${MAX_CONTENT_LENGTH.toLocaleString()} characters).` };
  }

  const { error } = await supabase
    .from("legal_pages")
    .update({
      title,
      content: content || null,
      updated_at: new Date().toISOString(),
      updated_by: check.userId,
    })
    .eq("slug", slug);

  if (error) {
    console.error("updateLegalPage error:", error.message);
    return { error: "Failed to save. Please try again." };
  }

  revalidatePath(`/${slug}`);
  revalidatePath("/admin/legal");
  return { success: true };
}
