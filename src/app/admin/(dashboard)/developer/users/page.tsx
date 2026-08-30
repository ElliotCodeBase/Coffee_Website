import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/auth";
import UsersManager from "@/components/admin/UsersManager";

export default async function UsersAdminPage() {
  const currentUser = await getCurrentUser();
  const supabase = await createClient();

  // Profiles table has role + name; we cross-reference with auth.users for email.
  const [{ data: profiles }, adminUsersResult] = await Promise.all([
    supabase.from("profiles").select("*"),
    createAdminClient().auth.admin.listUsers(),
  ]);

  const emailById = new Map(adminUsersResult.data?.users.map((u) => [u.id, u.email]) ?? []);

  const users = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailById.get(p.id) ?? null,
    full_name: p.full_name,
    role: p.role,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Users &amp; Roles</h1>
        <p className="text-sm text-stone-500 mt-1">Developer-only. Invite staff and manage who can access what.</p>
      </div>
      <UsersManager users={users} currentUserId={currentUser?.id || ""} />
    </div>
  );
}
