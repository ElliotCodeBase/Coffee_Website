import PageHeader from "@/components/admin/PageHeader";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/auth";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <div>
      <PageHeader
        title="My Account"
        description={user.email ?? undefined}
      />
      <ChangePasswordForm />
    </div>
  );
}
