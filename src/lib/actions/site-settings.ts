"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

const EDITABLE_FIELDS = [
  "business_name",
  "tagline",
  "logo_url",
  "logo_alt",
  "hero_image_url",
  "hero_headline",
  "hero_subtext",
  "about_image_url",
  "about_headline",
  "about_body",
  "address_line1",
  "address_line2",
  "map_embed_url",
  "hours_weekday",
  "hours_weekend",
  "phone",
  "email",
  "social_facebook",
  "social_twitter",
  "social_instagram",
  "social_linkedin",
  "footer_copyright",
  "meta_description",
] as const;

export async function updateSiteSettings(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const update: Record<string, string | null> = {};
  for (const field of EDITABLE_FIELDS) {
    const value = formData.get(field);
    update[field] = value === null || value === "" ? null : String(value);
  }

  const { error } = await supabase
    .from("site_settings")
    .update({ ...update, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", 1);

  if (error) {
    console.error("updateSiteSettings error:", error.message);
    return { error: "Failed to save changes. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/admin/site-info");
  return { success: true };
}

export async function updateNavLinks(links: { id: string; label: string; href: string }[]): Promise<ActionResult> {
  const supabase = await createClient();

  for (const link of links) {
    const { error } = await supabase
      .from("nav_links")
      .update({ label: link.label, href: link.href })
      .eq("id", link.id);
    if (error) {
      console.error("updateNavLinks error:", error.message);
      return { error: "Failed to save navigation changes." };
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/site-info");
  return { success: true };
}
