/* Default SEO / footer text, built from the business name and tagline.
   Used to pre-fill the admin "Footer & SEO" tab and as a fallback when a
   field is empty. Keep the wording in sync with
   supabase/migration_add_favicon_seo_title.sql, which seeds the same text. */
export interface SeoDefaultsInput {
  business_name?: string | null;
  tagline?: string | null;
}

export function buildSeoDefaults(input: SeoDefaultsInput, year = new Date().getFullYear()) {
  const name = input.business_name?.trim() || "Our Coffee Shop";
  const tagline = input.tagline?.trim() || "Coffee Shop";
  return {
    seo_title: `${name} | ${tagline}`,
    meta_description: `${name} is a cozy neighborhood coffee shop serving carefully roasted beans and fresh pastries. See our menu, opening hours and location, and stop by for a great cup.`,
    footer_copyright: `\u00A9 ${year} ${name}. All rights reserved.`,
  };
}
