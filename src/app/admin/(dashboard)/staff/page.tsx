import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/auth";
import StaffManager from "@/components/admin/StaffManager";

export default async function TeamAdminPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || (currentUser.profile?.role !== "admin" && currentUser.profile?.role !== "developer")) {
    redirect("/admin");
  }

  const adminClient = createAdminClient();
  const [{ data: profiles }, listUsersResult] = await Promise.all([
    adminClient.from("profiles").select("*").in("role", ["admin", "staff"]),
    adminClient.auth.admin.listUsers(),
  ]);

  const emailById = new Map(listUsersResult.data?.users.map((u) => [u.id, u.email]) ?? []);

  // Show all team members except the current user's own row
  const team = (profiles ?? [])
    .filter((p) => p.id !== currentUser.id)
    .map((p) => ({
      id: p.id,
      email: emailById.get(p.id) ?? null,
      full_name: p.full_name,
      role: p.role as "admin" | "staff",
      is_main_admin: p.is_main_admin ?? false,
    }));

  const currentUserIsMainAdmin = currentUser.profile?.is_main_admin ?? false;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Team</h1>
        <p className="text-sm text-stone-500 mt-1">
          Add other admins (full access) or staff (menu, messages &amp; analytics). Developer accounts are managed separately.
        </p>
      </div>
      <StaffManager
        team={team}
        currentUserId={currentUser.id}
        currentUserIsMainAdmin={currentUserIsMainAdmin}
      />
    </div>
  );
}
