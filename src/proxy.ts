import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/* Pages that a staff account can access. All other paths under /admin
   require the admin or developer role. */
export const STAFF_ALLOWED_PREFIXES = [
  "/admin/menu",
  "/admin/messages",
  "/admin/analytics",
  "/admin/account",
] as const;

/* The page a staff account goes to when it has no specific destination. */
export const STAFF_LANDING = "/admin/menu";

/* These paths do not require a session. */
const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/admin/set-password"]);

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;

  /* The login page and the invite set-password page must be reachable
     without a session. Do not call auth here. Calling auth on a request
     with no session rotates the session cookie unnecessarily. */
  if (PUBLIC_ADMIN_PATHS.has(path)) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  function redirect(url: URL) {
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("redirectTo", path);
    return redirect(loginUrl);
  }

  /* Read the user's role once per request. */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  /* A signed-in account with no profile row (or an unreadable one) has NO
     admin role. Without this check it fell through and could open admin
     pages — for example an account created through Supabase's public
     sign-up endpoint. Fail closed. */
  if (!role) {
    return redirect(new URL("/admin/login", request.url));
  }

  if (path.startsWith("/admin/developer") && role !== "developer") {
    return redirect(new URL("/admin", request.url));
  }

  if (role === "staff" && !STAFF_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return redirect(new URL(STAFF_LANDING, request.url));
  }

  return response;
}

export const config = {
  /* Scope the middleware to the /admin path only.
     The previous matcher also included a catch-all pattern that ran a full
     Supabase getUser() call on every public request, including server
     action POSTs, /api/contact, and router prefetches. Each of those can
     rotate the auth refresh token. Two concurrent requests (for example, a
     prefetch and a login POST) could invalidate the new session and redirect
     the user back to the login screen. Scoping to /admin avoids this. */
  matcher: ["/admin/:path*"],
};
