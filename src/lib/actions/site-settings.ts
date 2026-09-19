"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SiteSettings } from "@/types/database";

export interface ActionResult {
  success?: boolean;
  error?: string;
}


const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Server actions are publicly reachable endpoints — being unable to load
 * /admin/site-info in the UI does not stop anyone from POSTing to the
 * action directly. RLS blocks the write too, but failing here gives a
 * clear error instead of a silent "Failed to save".
 */
async function assertCanEditSite(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "developer") return { ok: false as const };

  return { ok: true as const, userId: user.id };
}

/**
 * Fields that end up in an href/src attribute on the public site. Without
 * this, an `javascript:...` value saved here becomes stored XSS for every
 * visitor who clicks a social icon.
 */
const URL_FIELDS = new Set([
  "logo_url",
  "hero_image_url",
  "about_image_url",
  "map_embed_url",
  "social_facebook",
  "social_twitter",
  "social_instagram",
  "social_linkedin",
]);

function isSafeExternalUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Allows in-page anchors and same-site paths, plus http(s) URLs. */
function isSafeLinkTarget(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) return /^#[\w-]*$/.test(trimmed);
  if (trimmed.startsWith("/")) return !trimmed.startsWith("//") && !trimmed.includes("\\");
  return isSafeExternalUrl(trimmed);
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

// Fields whose *previous* value gets archived to image_history whenever
// they change, so the client can revert to an older logo/hero/about
// image later instead of having to re-upload it from scratch.
const TRACKED_IMAGE_FIELDS = ["logo_url", "hero_image_url", "about_image_url"] as const;

// Keep at most this many old versions per field — otherwise a client who
// changes their hero image every week for a year ends up with an
// ever-growing table for no real benefit.
const MAX_HISTORY_PER_FIELD = 8;

async function archiveOldImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fieldName: (typeof TRACKED_IMAGE_FIELDS)[number],
  oldUrl: string | null
) {
  if (!oldUrl) return; // nothing to archive — field was already empty

  const { error } = await supabase.from("image_history").insert({ field_name: fieldName, image_url: oldUrl });
  if (error) {
    console.error(`archiveOldImage (${fieldName}) error:`, error.message);
    return; // don't let history bookkeeping block the actual save
  }

  // Trim anything beyond the cap, oldest first.
  const { data: rows } = await supabase
    .from("image_history")
    .select("id")
    .eq("field_name", fieldName)
    .order("replaced_at", { ascending: false });

  const idsToDelete = (rows ?? []).slice(MAX_HISTORY_PER_FIELD).map((r) => r.id);
  if (idsToDelete.length > 0) {
    await supabase.from("image_history").delete().in("id", idsToDelete);
  }
}

export async function updateSiteSettings(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const check = await assertCanEditSite(supabase);
  if (!check.ok) return { error: "You don't have permission to edit site settings." };
  const user = { id: check.userId };

  const update: Record<string, string | null> = {};
  for (const field of EDITABLE_FIELDS) {
    const value = formData.get(field);
    const stringValue = value === null ? "" : String(value).trim();

    if (stringValue && URL_FIELDS.has(field) && !isSafeExternalUrl(stringValue)) {
      return { error: `“${field.replace(/_/g, " ")}” must be a full http:// or https:// URL.` };
    }

    update[field] = stringValue === "" ? null : stringValue;
  }

  // Archive whichever tracked images are actually about to change,
  // before overwriting them, so they can be restored later.
  const { data: current } = await supabase.from("site_settings").select("*").eq("id", 1).single();

  if (current) {
    for (const field of TRACKED_IMAGE_FIELDS) {
      const oldValue = (current as SiteSettings)[field];
      const newValue = update[field];
      if (oldValue && oldValue !== newValue) {
        await archiveOldImage(supabase, field, oldValue);
      }
    }
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

/**
 * Reverts one image field (logo/hero/about) back to a previous value
 * from image_history. The image that's currently active gets archived
 * too before being replaced, so restoring doesn't destroy the ability
 * to go forward again later.
 */
export async function restoreSiteImage(
  fieldName: (typeof TRACKED_IMAGE_FIELDS)[number],
  imageUrl: string
): Promise<ActionResult> {
  if (!TRACKED_IMAGE_FIELDS.includes(fieldName)) {
    return { error: "That field can't be restored this way." };
  }

  if (!isSafeExternalUrl(imageUrl)) {
    return { error: "That image URL isn't valid." };
  }

  const supabase = await createClient();
  const check = await assertCanEditSite(supabase);
  if (!check.ok) return { error: "You don't have permission to edit site settings." };
  const user = { id: check.userId };

  const { data: current } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  const currentValue = current ? (current as SiteSettings)[fieldName] : null;

  if (currentValue && currentValue !== imageUrl) {
    await archiveOldImage(supabase, fieldName, currentValue);
  }

  const updatePayload = {
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  } as Partial<SiteSettings>;
  updatePayload[fieldName] = imageUrl;

  const { error } = await supabase.from("site_settings").update(updatePayload).eq("id", 1);

  if (error) {
    console.error("restoreSiteImage error:", error.message);
    return { error: "Failed to restore that image. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/admin/site-info");
  return { success: true };
}

export async function updateNavLinks(links: { id: string; label: string; href: string }[]): Promise<ActionResult> {
  const supabase = await createClient();

  const check = await assertCanEditSite(supabase);
  if (!check.ok) return { error: "You don't have permission to edit navigation." };

  if (!Array.isArray(links) || links.length > 50) {
    return { error: "Too many navigation links." };
  }

  // Validate everything BEFORE writing anything, so a bad row can't leave
  // the nav half-updated.
  for (const link of links) {
    if (!UUID_RE.test(String(link?.id ?? ""))) {
      return { error: "Invalid navigation link." };
    }
    const label = String(link.label ?? "").trim();
    if (!label || label.length > 60) {
      return { error: "Each navigation label must be 1–60 characters." };
    }
    // The old version wrote href straight through. A value of
    // `javascript:fetch(...)` saved here rendered as a clickable link in
    // the public header for every visitor — stored XSS.
    if (!isSafeLinkTarget(String(link.href ?? ""))) {
      return { error: "Links must be an #anchor, a /path, or a full http(s):// URL." };
    }
  }

  for (const link of links) {
    const { error } = await supabase
      .from("nav_links")
      .update({ label: String(link.label).trim(), href: String(link.href).trim() })
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
