import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/auth";
import MessagesList from "@/components/admin/MessagesList";

export default async function MessagesAdminPage() {
  const supabase = await createClient();
  const [currentUser, { data: submissions }] = await Promise.all([
    getCurrentUser(),
    supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
  ]);

  const canManage = currentUser?.profile?.role === "admin" || currentUser?.profile?.role === "developer";

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Messages</h1>
        <p className="text-sm text-stone-500 mt-1">Contact form submissions, saved as a backup even after email is sent.</p>
      </div>
      <MessagesList submissions={submissions ?? []} canManage={canManage} />
    </div>
  );
}
