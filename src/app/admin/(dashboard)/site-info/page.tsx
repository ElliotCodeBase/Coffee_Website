import { getSiteSettings, getNavLinks } from "@/lib/data/public";
import SiteInfoForm from "@/components/admin/SiteInfoForm";
import NavLinksForm from "@/components/admin/NavLinksForm";

export default async function SiteInfoPage() {
  const [settings, navLinks] = await Promise.all([getSiteSettings(), getNavLinks()]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Site Info</h1>
        <p className="text-sm text-stone-500 mt-1">Edit the text, images, and contact details shown on your site.</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        <NavLinksForm navLinks={navLinks} />
        <SiteInfoForm settings={settings} />
      </div>
    </div>
  );
}
