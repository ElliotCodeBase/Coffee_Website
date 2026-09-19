import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/* Supabase client for Server Components, Route Handlers, and Server Actions.
   It reads and writes the auth session via cookies so Row Level Security
   policies apply correctly for the logged-in user. */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* setAll was called from a Server Component. This error is
               safe to ignore when the middleware refreshes sessions. */
          }
        },
      },
    }
  );
}

/* Admin client that uses the SERVICE ROLE key. This client bypasses Row
   Level Security entirely. Never import this client into code that runs
   in the browser. Never expose the service role key to the browser.
   Use this client only in server-side code that requires elevated access,
   such as creating new user accounts.

   It is a plain supabase-js client, NOT the cookie-based SSR client: an
   admin client must never read or write a user session, and Supabase's own
   guidance is to create it with persistSession/autoRefreshToken disabled.
   It throws early with a readable message when the environment is wrong,
   instead of failing later with an opaque 401 from the Auth API. */
export function createAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase admin client is not configured: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set."
    );
  }
  if (key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is set to the anon key. Use the service_role (secret) key instead.");
  }

  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}
