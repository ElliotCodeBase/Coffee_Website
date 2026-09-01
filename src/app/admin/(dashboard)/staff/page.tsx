import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/auth";
import StaffManager from "@/components/admin/StaffManager";

export default async function TeamAdminPage() {
  const currentUser = await getCurrentUser();

  // Belt-and-suspenders: middleware doesn't block this page for
  // non-admin/developer roles today, so double-check here too.
  if (!currentUser || (currentUser.profile?.role !== "admin" && currentUser.profile?.role !== "developer")) {
    redirect("/admin");
  }

  // Service-role client: a plain "admin" viewer's own session can't read
  // other people's profile rows under RLS, so this page always reads via
  // the service role and lists only admin + staff on purpose (developer
  // accounts are managed on the separate Users & Roles page instead).
  const adminClient = createAdminClient();
  const [{ data: profiles }, listUsersResult] = await Promise.all([
    adminClient.from("profiles").select("*").in("role", ["admin", "staff"]),
    adminClient.auth.admin.listUsers(),
  ]);

  const emailById = new Map(listUsersResult.data?.users.map((u) => [u.id, u.email]) ?? []);

  const team = (profiles ?? [])
    .filter((p) => p.id !== currentUser.id) // don't show/let them remove themselves here
    .map((p) => ({
      id: p.id,
      email: emailById.get(p.id) ?? null,
      full_name: p.full_name,
      role: p.role as "admin" | "staff",
    }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Team</h1>
        <p className="text-sm text-stone-500 mt-1">
          Add other admins (full access) or staff (menu-only access). Developer accounts are managed separately.
        </p>
      </div>
      <StaffManager team={team} />
    </div>
  );
}
