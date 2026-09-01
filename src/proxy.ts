import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  // Refresh session if expired — required for Server Components to see auth state
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Protect everything under /admin except the login page and the
  // password-setup page (invited users land there with no session yet —
  // Supabase's browser SDK establishes one client-side from the invite
  // link's URL hash, which the server never sees).
  if (path.startsWith("/admin") && path !== "/admin/login" && path !== "/admin/set-password") {
    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectTo", path);
      return NextResponse.redirect(loginUrl);
    }

    // Staff accounts can only manage the food & drinks menu — bounce
    // them out of every other admin page (deeper check again via RLS).
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (viewerProfile?.role === "staff" && !path.startsWith("/admin/menu")) {
      return NextResponse.redirect(new URL("/admin/menu", request.url));
    }
  }

  // Protect developer-only routes at the middleware layer too
  // (deeper role check happens again in the page/layout + RLS)
  if (path.startsWith("/admin/developer")) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "developer") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    /*
     * Skip static assets and image optimization files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
