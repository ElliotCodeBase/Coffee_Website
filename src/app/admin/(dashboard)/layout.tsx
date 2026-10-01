import { redirect } from "next/navigation";
import type { Viewport } from "next";
import { getCurrentUser } from "@/lib/data/auth";
import { getSiteSettings } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  robots: { index: false, follow: false },
};

/* Let the admin extend under the phone's home-indicator area (the sidebar's
   bottom bar and the page background fill it), instead of leaving a strip of
   the website's brown body color showing there. */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#fafaf9",
};

async function countNewMessages(): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("contact_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "new");
    return count ?? 0;
  } catch {
    return 0; // no badge rather than a broken page
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  /* Everything the shell needs is fetched at the same time (it used to be
     three lookups one after the other on every navigation). */
  const [user, siteSettings, newMessages] = await Promise.all([getCurrentUser(), getSiteSettings(), countNewMessages()]);

  // Middleware already protects /admin/*, but this is a second line of
  // defense in case the layout is ever reached without middleware running.
  if (!user || !user.profile) {
    redirect("/admin/login");
  }

  const businessName = siteSettings?.business_name?.trim() || undefined;

  return (
    <div className="admin-shell md:flex bg-stone-50 min-h-dvh font-body text-caffeine-dark">
      <AdminSidebar role={user.profile?.role} businessName={businessName} newMessages={newMessages} />
      <main className="flex-1 min-w-0 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-6 md:pb-10 lg:p-10">{children}</main>
    </div>
  );
}
