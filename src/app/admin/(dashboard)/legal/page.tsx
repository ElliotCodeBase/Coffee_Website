import PageHeader from "@/components/admin/PageHeader";
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
      <PageHeader
        title="Legal Pages"
        description="Edit the Terms of Service and Privacy Policy shown on your public site. Visible here to admin and developer accounts only."
      />
      <LegalPagesForm terms={terms} privacy={privacy} />
    </div>
  );
}
