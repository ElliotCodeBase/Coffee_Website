import { getSiteSettings, getThemeSettings } from "@/lib/data/public";
import { loaderConfigFrom } from "@/lib/loader-config";
import LoaderClient from "@/components/site/LoaderClient";

/* Rendered first in the home page so it is part of the very first HTML the
   browser paints (no flash of the page before the loader). "Once per
   session" is decided before first paint by the tiny script below, so a
   repeat visit never flashes the loader either. */
const SKIP_SCRIPT = `try{if(sessionStorage.getItem("sl-seen"))document.documentElement.classList.add("sl-skip")}catch(e){}`;

export default async function SiteLoader() {
  const [theme, settings] = await Promise.all([getThemeSettings(), getSiteSettings()]);
  const config = loaderConfigFrom(theme, settings?.business_name ?? "");
  if (!config.enabled) return null;

  return (
    <>
      {config.frequency === "session" && <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />}
      {/* Without JavaScript the loader could never finish, so hide it. */}
      <noscript>
        <style>{`.site-loader{display:none!important}`}</style>
      </noscript>
      <LoaderClient config={config} />
    </>
  );
}
