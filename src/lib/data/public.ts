import { createClient } from "@/lib/supabase/server";
import type { SiteSettings, NavLink, MenuItem, ThemeSettings, ImageHistoryEntry, ImageHistoryField } from "@/types/database";

/**
 * All functions here run on the server (Server Components) and read
 * only publicly-visible rows — enforced both by the query filters
 * below AND by Postgres Row Level Security as a second line of defense.
 */

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  if (error) {
    console.error("getSiteSettings error:", error.message);
    return null;
  }
  return data;
}

export async function getThemeSettings(): Promise<ThemeSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("theme_settings").select("*").eq("id", 1).single();
  if (error) {
    console.error("getThemeSettings error:", error.message);
    return null;
  }
  return data;
}

export async function getNavLinks(): Promise<NavLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nav_links")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("getNavLinks error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getMenuItems(): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_available", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("getMenuItems error:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Previous logo/hero/about images the client can revert back to. RLS
 * restricts this to admin/developer accounts, so a non-admin viewer
 * (or the public site) just gets an empty result rather than an error.
 */
export async function getImageHistory(): Promise<Record<ImageHistoryField, ImageHistoryEntry[]>> {
  const empty: Record<ImageHistoryField, ImageHistoryEntry[]> = {
    logo_url: [],
    hero_image_url: [],
    about_image_url: [],
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("image_history")
    .select("*")
    .order("replaced_at", { ascending: false });

  if (error) {
    console.error("getImageHistory error:", error.message);
    return empty;
  }

  for (const row of data ?? []) {
    empty[row.field_name].push(row);
  }
  return empty;
}
