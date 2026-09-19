import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/* Supabase client for Client Components ("use client").
   This client uses the public anon key. It is safe to use in the browser.
   Row Level Security on the database enforces all access control. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
