import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/auth";
import { getLegalPage } from "@/lib/data/public";
import LegalPagesForm from "@/components/admin/LegalPagesForm";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function LegalPagesAdminPage() {
  const user = await getCurrentUser();

  // Admin-panel feature, deliberately not available to staff.
  if (!user || (user.profile?.role !== "admin" && user.profile?.role !== "developer")) {
    redirect("/admin");
  }

  const [terms, privacy] = await Promise.all([getLegalPage("terms"), getLegalPage("privacy")]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy text-2xl font-bold text-caffeine-dark">Legal Pages</h1>
        <p className="mt-1 text-sm text-stone-500">
          Edit the Terms of Service and Privacy Policy shown on your public site. Visible here to admin and
          developer accounts only.
        </p>
      </div>
      <LegalPagesForm terms={terms} privacy={privacy} />
    </div>
  );
}
