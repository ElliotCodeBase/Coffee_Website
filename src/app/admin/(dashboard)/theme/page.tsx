import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/auth";
import { getThemeSettings } from "@/lib/data/public";
import ThemeForm from "@/components/admin/ThemeForm";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ThemeAdminPage() {
  const user = await getCurrentUser();

  // Admin-panel feature (business owner + developer) — staff cannot reach it.
  if (!user || (user.profile?.role !== "admin" && user.profile?.role !== "developer")) {
    redirect("/admin");
  }

  const theme = await getThemeSettings();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Theme &amp; Colors</h1>
        <p className="text-sm text-stone-500 mt-1">
          Pick a color palette and font pairing for the header, body, buttons and text. Changes apply site-wide
          the moment you save — no redeploy needed.
        </p>
      </div>
      <ThemeForm theme={theme} />
    </div>
  );
}
