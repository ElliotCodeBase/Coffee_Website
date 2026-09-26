"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { SiteSettings } from "@/types/database";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Verify that the current user can edit site settings.
   Server actions are public endpoints. A user who cannot open
   /admin/site-info in the browser can still POST to a server action
   directly. Row Level Security also blocks the write, but this check
   returns a clear error message instead of a silent failure. */
async function assertCanEditSite(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "developer") return { ok: false as const };

  return { ok: true as const, userId: user.id };
}

/* Fields that are used in an href or src attribute on the public site.
   Without this check, saving javascript:... to one of these fields
   creates a stored XSS vulnerability for every visitor who clicks
   the link or loads the image. */
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

/* Allow in-page anchors, same-site paths, and http(s) URLs. */
function isSafeLinkTarget(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) return /^#[\w-]*$/.test(trimmed);
  if (trimmed.startsWith("/")) return !trimmed.startsWith("//") && !trimmed.includes("\\");
  return isSafeExternalUrl(trimmed);
}

/* Per-field length caps so a single save can't store megabytes of text, and
   the email field must look like an address (it is rendered as a mailto: link). */
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const MAX_LEN: Record<string, number> = { about_body: 5000, hero_subtext: 1000, meta_description: 320 };
const URL_MAX_LEN = 2048;
const DEFAULT_MAX_LEN = 300;

/* The map field is rendered inside an <iframe>. Limit it to https URLs on
   the map providers the site is built for, so it can't frame an arbitrary
   third-party page inside the contact section. */
const MAP_HOSTS = new Set(["www.google.com", "google.com", "maps.google.com", "www.openstreetmap.org", "openstreetmap.org"]);
function isAllowedMapEmbed(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && MAP_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
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

/* Save the old value of an image field to image_history before it is
   replaced. This lets the user restore a previous image without
   uploading it again. */
const TRACKED_IMAGE_FIELDS = ["logo_url", "hero_image_url", "about_image_url", "favicon_url"] as const;

/* Keep at most this many old versions per field. This prevents the
   image_history table from growing without limit. */
const MAX_HISTORY_PER_FIELD = 8;

async function archiveOldImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fieldName: (typeof TRACKED_IMAGE_FIELDS)[number],
  oldUrl: string | null
) {
  if (!oldUrl) return;

  const { error } = await supabase.from("image_history").insert({ field_name: fieldName, image_url: oldUrl });
  if (error) {
    console.error(`archiveOldImage (${fieldName}) error:`, error.message);
    return;
  }

  /* Delete old entries beyond the limit, starting with the oldest. */
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
  if (!check.ok) return { error: "You do not have permission to edit site settings." };
  const user = { id: check.userId };

  const update: Record<string, string | null> = {};
  for (const field of EDITABLE_FIELDS) {
    const value = formData.get(field);
    const stringValue = value === null ? "" : String(value).trim();

    if (stringValue && URL_FIELDS.has(field) && !isSafeExternalUrl(stringValue)) {
      return { error: `"${field.replace(/_/g, " ")}" must be a full http:// or https:// URL.` };
    }

    const maxLen = URL_FIELDS.has(field) ? URL_MAX_LEN : (MAX_LEN[field] ?? DEFAULT_MAX_LEN);
    if (stringValue.length > maxLen) {
      return { error: `"${field.replace(/_/g, " ")}" is too long (maximum ${maxLen} characters).` };
    }
    if (field === "email" && stringValue && !EMAIL_RE.test(stringValue)) {
      return { error: "Enter a valid email address." };
    }
    if (field === "map_embed_url" && stringValue && !isAllowedMapEmbed(stringValue)) {
      return { error: "The map link must be an https:// Google Maps or OpenStreetMap embed URL." };
    }

    update[field] = stringValue === "" ? null : stringValue;
  }

  /* Read the current values before overwriting. Archive any image fields
     that are about to change so the user can restore them later. */
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

/* Revert one image field (logo, hero, or about) to a value from
   image_history. The current value is archived first so the user can
   restore it again if needed. */
export async function restoreSiteImage(
  fieldName: (typeof TRACKED_IMAGE_FIELDS)[number],
  imageUrl: string
): Promise<ActionResult> {
  if (!TRACKED_IMAGE_FIELDS.includes(fieldName)) {
    return { error: "That field cannot be restored this way." };
  }

  if (!isSafeExternalUrl(imageUrl)) {
    return { error: "That image URL is not valid." };
  }

  const supabase = await createClient();
  const check = await assertCanEditSite(supabase);
  if (!check.ok) return { error: "You do not have permission to edit site settings." };
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
  if (!check.ok) return { error: "You do not have permission to edit navigation." };

  if (!Array.isArray(links) || links.length > 50) {
    return { error: "Too many navigation links." };
  }

  /* Validate all links before writing any of them. This prevents a bad
     entry from leaving the navigation in a partially updated state. */
  for (const link of links) {
    if (!UUID_RE.test(String(link?.id ?? ""))) {
      return { error: "Invalid navigation link." };
    }
    const label = String(link.label ?? "").trim();
    if (!label || label.length > 60) {
      return { error: "Each navigation label must be between 1 and 60 characters." };
    }
    /* The previous version wrote the href value without validation.
       A value such as javascript:fetch(...) saved here would appear as a
       clickable link in the public header for every visitor. This is a
       stored XSS vulnerability. Validate the href before saving. */
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

