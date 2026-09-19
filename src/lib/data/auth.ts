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
   function to read the user's identity inside pages and layouts. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return { id: user.id, email: user.email ?? null, profile: profile ?? null };
}

export async function requireDeveloper(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user || user.profile?.role !== "developer") return null;
  return user;
}
