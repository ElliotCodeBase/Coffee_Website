import { getSiteSettings, getNavLinks, getImageHistory } from "@/lib/data/public";
import SiteInfoManager from "@/components/admin/SiteInfoManager";

export default async function SiteInfoPage() {
  const [settings, navLinks, imageHistory] = await Promise.all([
    getSiteSettings(),
    getNavLinks(),
    getImageHistory(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy text-2xl font-bold text-caffeine-dark">Site Info</h1>
        <p className="mt-1 text-sm text-stone-500">
          Everything that appears on your public site — text, images, contact details and navigation.
        </p>
      </div>

      <SiteInfoManager settings={settings} navLinks={navLinks} imageHistory={imageHistory} />
    </div>
  );
}
