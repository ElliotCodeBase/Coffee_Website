import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { SiteSettings, NavLink, MenuItem, ThemeSettings, ImageHistoryEntry, ImageHistoryField } from "@/types/database";

/* These functions run in Server Components and read only public rows.
   Query filters enforce this at the application level. Postgres Row Level
   Security enforces it again at the database level as a second check.

   Every failure mode is caught and turned into a safe fallback value
   (null / [] / empty object) rather than a thrown error — including
   errors from createClient() itself and from the query's own network
   call. Several independent parts of the page (the header, the hero,
   the footer) call these same functions in their own Suspense/error
   boundary, and a boundary can only stay clear of a failure elsewhere
   on the page if the function it calls never throws. `cache()` also
   means calling e.g. getSiteSettings() from both the header and the
   rest of the page costs one query per request, not two. */

async function safeQuery<T>(label: string, run: () => Promise<{ data: T | null; error: { message: string } | null }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await run();
    if (error) {
      console.error(`${label} error:`, error.message);
      return fallback;
    }
    return data ?? fallback;
  } catch (err) {
    /* A thrown exception here (connection refused, DNS failure, the
       Supabase project paused or mid-restart, cookies() failing, etc.)
       would otherwise propagate up and take down every Server Component
       awaiting this call in the same render pass — including ones, like
       the header, that have nothing to do with whichever query failed. */
    console.error(`${label} threw:`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

export const getSiteSettings = cache(async function getSiteSettings(): Promise<SiteSettings | null> {
  return safeQuery(
    "getSiteSettings",
    async () => {
      const supabase = await createClient();
      return supabase.from("site_settings").select("*").eq("id", 1).single();
    },
    null
  );
});

export const getThemeSettings = cache(async function getThemeSettings(): Promise<ThemeSettings | null> {
  return safeQuery(
    "getThemeSettings",
    async () => {
      const supabase = await createClient();
      return supabase.from("theme_settings").select("*").eq("id", 1).single();
    },
    null
  );
});

export const getNavLinks = cache(async function getNavLinks(): Promise<NavLink[]> {
  return safeQuery(
    "getNavLinks",
    async () => {
      const supabase = await createClient();
      return supabase.from("nav_links").select("*").eq("is_visible", true).order("sort_order", { ascending: true });
    },
    []
  );
});

export const getMenuItems = cache(async function getMenuItems(): Promise<MenuItem[]> {
  return safeQuery(
    "getMenuItems",
    async () => {
      const supabase = await createClient();
      return supabase.from("menu_items").select("*").eq("is_available", true).order("sort_order", { ascending: true });
    },
    []
  );
});

/* Return previous logo, hero, and about images so an admin can revert
   to an older image without uploading it again. Row Level Security
   restricts this to admin and developer accounts. Non-admin users and
   the public site receive an empty result instead of an error. */
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
