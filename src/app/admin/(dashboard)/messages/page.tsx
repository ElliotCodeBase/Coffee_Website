import PageHeader from "@/components/admin/PageHeader";
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
      <PageHeader
        title="Messages"
        description="Everything sent through your contact form. Every message is also kept here, even after the email has been delivered."
      />
      <MessagesList submissions={submissions ?? []} canManage={canManage} />
    </div>
  );
}
