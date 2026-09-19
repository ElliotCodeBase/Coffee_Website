import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Pages a `staff` account is allowed to reach. Everything else under
 * /admin is admin/developer territory.
 */
export const STAFF_ALLOWED_PREFIXES = [
  "/admin/menu",
  "/admin/messages",
  "/admin/analytics",
  "/admin/account",
] as const;

/** Where a staff account lands when it has nowhere better to go. */
export const STAFF_LANDING = "/admin/menu";

/** Reachable without a session. */
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

  // Login and the invite "set password" page must stay reachable while
  // signed out. Touching auth here at all would refresh (and rotate) the
  // session cookie on a request that has no session to refresh.
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

  // One profile read for the whole request — the old version issued a
  // second identical query for /admin/developer/* on top of this one.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  if (path.startsWith("/admin/developer") && role !== "developer") {
    return redirect(new URL("/admin", request.url));
  }

  if (role === "staff" && !STAFF_ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return redirect(new URL(STAFF_LANDING, request.url));
  }

  return response;
}

export const config = {
  // Scoped deliberately to /admin only.
  //
  // The previous matcher also included a catch-all
  // "/((?!_next/static|_next/image|favicon.ico|...).*)" which ran a full
  // Supabase `getUser()` round trip on EVERY request to the public site —
  // including server-action POSTs, /api/contact, and router prefetches.
  // Each of those can refresh and rotate the auth refresh token, so two
  // requests racing (a prefetch firing while the login POST is in flight)
  // could invalidate the session that was just issued and bounce the user
  // straight back to the login screen. It also added a network round trip
  // to the TTFB of every public page load for no benefit: nothing outside
  // /admin is gated.
  matcher: ["/admin/:path*"],
};
