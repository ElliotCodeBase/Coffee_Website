import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/auth";
import { getSiteSettings } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Middleware already protects /admin/*, but this is a second line of
  // defense in case the layout is ever reached without middleware running
  // (e.g. during certain edge-runtime scenarios).
  if (!user || !user.profile) {
    redirect("/admin/login");
  }

  // Cached alongside the public site's own call to getSiteSettings(), so
  // this costs no extra query per request. Falls back to AdminSidebar's
  // own "Caffeine" default if site_settings hasn't been configured yet.
  const siteSettings = await getSiteSettings();
  const businessName = siteSettings?.business_name?.trim() || undefined;

  // Unread-message count for the sidebar badge. Any failure just means "no badge".
  let newMessages = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("contact_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "new");
    newMessages = count ?? 0;
  } catch {
    newMessages = 0;
  }

  return (
    <div className="md:flex bg-stone-50 min-h-screen font-body text-caffeine-dark">
      <AdminSidebar role={user.profile?.role} businessName={businessName} newMessages={newMessages} />
      <main className="flex-1 min-w-0 p-4 pb-24 sm:p-6 md:pb-10 lg:p-10">{children}</main>
    </div>
  );
}
