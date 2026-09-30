import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/auth";
import { getSiteSettings, getThemeSettings } from "@/lib/data/public";
import ThemeForm from "@/components/admin/ThemeForm";
import LoaderSettingsForm from "@/components/admin/LoaderSettingsForm";
import AdminTabs from "@/components/admin/AdminTabs";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ThemeAdminPage() {
  const user = await getCurrentUser();

  // Admin-panel feature (business owner + developer) — staff cannot reach it.
  if (!user || (user.profile?.role !== "admin" && user.profile?.role !== "developer")) {
    redirect("/admin");
  }

  const [theme, settings] = await Promise.all([getThemeSettings(), getSiteSettings()]);

  return (
    <div>
      <PageHeader
        title="Look & Feel"
        description="Choose the colors, the fonts and the opening animation of your website. Every change goes live the moment you save — nothing to publish."
      />
      <AdminTabs
        tabs={[
          {
            key: "colors",
            label: "Colors & fonts",
            hint: "How the site looks",
            content: <ThemeForm theme={theme} />,
          },
          {
            key: "loading",
            label: "Loading animation",
            hint: "What shows when it opens",
            content: <LoaderSettingsForm theme={theme} businessName={settings?.business_name?.trim() || "your business"} />,
          },
        ]}
      />
    </div>
  );
}
