import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Middleware already protects /admin/*, but this is a second line of
  // defense in case the layout is ever reached without middleware running
  // (e.g. during certain edge-runtime scenarios).
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex bg-stone-50 min-h-screen font-body text-caffeine-dark">
      <AdminSidebar role={user.profile?.role} />
      <main className="flex-1 min-w-0 p-6 sm:p-10">{children}</main>
    </div>
  );
}
