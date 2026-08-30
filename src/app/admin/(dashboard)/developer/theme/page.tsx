import { getThemeSettings } from "@/lib/data/public";
import ThemeForm from "@/components/admin/ThemeForm";

export default async function ThemeAdminPage() {
  const theme = await getThemeSettings();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Theme &amp; Design</h1>
        <p className="text-sm text-stone-500 mt-1">
          Developer-only. Colors and fonts apply site-wide without a code deploy.
        </p>
      </div>
      <ThemeForm theme={theme} />
    </div>
  );
}
