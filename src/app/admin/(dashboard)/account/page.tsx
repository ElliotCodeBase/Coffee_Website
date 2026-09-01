import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/auth";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">My Account</h1>
        <p className="text-sm text-stone-500 mt-1">{user.email}</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
