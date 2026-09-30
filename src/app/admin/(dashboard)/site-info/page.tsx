import PageHeader from "@/components/admin/PageHeader";
import { getSiteSettings, getNavLinks, getImageHistory, getContactTopics } from "@/lib/data/public";
import SiteInfoManager from "@/components/admin/SiteInfoManager";

export default async function SiteInfoPage() {
  const [settings, navLinks, imageHistory, contactTopics] = await Promise.all([
    getSiteSettings(),
    getNavLinks(),
    getImageHistory(),
    getContactTopics(),
  ]);

  return (
    <div>
      <PageHeader
        title="Text, photos & hours"
        description="Everything visitors read and see on your website: the top headline, your story, photos, opening hours, contact details and menu links."
        tips={["Changes go live as soon as you press Save — there is nothing to publish.", "Replaced a photo by mistake? Older versions are kept in Image history."]}
      />

      <SiteInfoManager settings={settings} navLinks={navLinks} imageHistory={imageHistory} contactTopics={contactTopics} />
    </div>
  );
}
