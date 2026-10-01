import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export interface CurrentUser {
  id: string;
  email: string | null;
  profile: Profile | null;
}

/* Return the authenticated user and their profile (role and name).
   Return null if the user is not authenticated.
   Route protection happens in the middleware (proxy.ts). Use this
   function to read the user's identity inside pages and layouts.

   SPEED: this runs in the layout AND in the page on every admin navigation.
   - cache() makes the two calls share one result per request (it used to do
     the full lookup twice).
   - getClaims() checks the session token locally when the project uses
     asymmetric JWT keys, instead of a network round trip to Supabase Auth
     (it falls back to that round trip automatically when it can't).
   The proxy has already fully verified the session for this request, and
   every mutation (server action) re-checks with getUser() itself, so this
   is only used to decide what to render. */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  let id: string | null = null;
  let email: string | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) {
      id = data.claims.sub;
      email = (data.claims.email as string | undefined) ?? null;
    }
  } catch {
    /* fall through to getUser() */
  }
  if (!id) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    id = user.id;
    email = user.email ?? null;
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();
  return { id, email, profile: profile ?? null };
});

export async function requireDeveloper(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user || user.profile?.role !== "developer") return null;
  return user;
}
