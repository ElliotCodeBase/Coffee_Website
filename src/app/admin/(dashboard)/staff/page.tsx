import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/auth";
import StaffManager from "@/components/admin/StaffManager";

export default async function StaffAdminPage() {
  const currentUser = await getCurrentUser();

  // Belt-and-suspenders: middleware doesn't block this page for
  // non-staff roles today, so double-check here too.
  if (!currentUser || (currentUser.profile?.role !== "admin" && currentUser.profile?.role !== "developer")) {
    redirect("/admin");
  }

  // Service-role client: a plain "admin" viewer's own session can't read
  // other people's profile rows under RLS, so this page always reads via
  // the service role and lists only role = staff on purpose.
  const admin = createAdminClient();
  const [{ data: profiles }, listUsersResult] = await Promise.all([
    admin.from("profiles").select("*").eq("role", "staff"),
    admin.auth.admin.listUsers(),
  ]);

  const emailById = new Map(listUsersResult.data?.users.map((u) => [u.id, u.email]) ?? []);

  const staff = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailById.get(p.id) ?? null,
    full_name: p.full_name,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Staff</h1>
        <p className="text-sm text-stone-500 mt-1">
          Staff accounts can only add, edit, and remove items on the food &amp; drinks menu. They can&apos;t
          change anything else on the site.
        </p>
      </div>
      <StaffManager staff={staff} />
    </div>
  );
}
