import type { Metadata } from "next";
import { getSiteSettings, getNavLinks, getMenuItems, getReviews } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/site/Header";
import HeroStory from "@/components/site/HeroStory";
import Menu from "@/components/site/Menu";
import Reviews from "@/components/site/Reviews";
import LocationSection from "@/components/site/LocationSection";
import ContactSection from "@/components/site/ContactSection";
import Footer from "@/components/site/Footer";
import ThemeVars from "@/components/site/ThemeVars";
import CodeInjector from "@/components/site/CodeInjector";

async function getActiveSnippets(location: "head" | "body_start" | "body_end") {
  const supabase = await createClient();
  const { data } = await supabase
    .from("custom_code_snippets")
    .select("id, code")
    .eq("location", location)
    .eq("is_active", true);
  return data ?? [];
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const name = settings?.business_name || "Caffeine";
  const description =
    settings?.meta_description ||
    settings?.hero_subtext ||
    "A cozy neighborhood coffee shop serving carefully roasted beans and fresh pastries.";

  return {
    title: `${name} | ${settings?.tagline || "Cozy Craft Coffee"}`,
    description,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: name,
      description,
      url: "/",
      siteName: name,
      images: settings?.hero_image_url
        ? [{ url: settings.hero_image_url, alt: `${name} — ${settings?.tagline || "coffee shop"}` }]
        : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },
  };
}

export default async function HomePage() {
  const [settings, navLinks, menuItems, reviews, bodyStartSnippets, bodyEndSnippets] = await Promise.all([
    getSiteSettings(),
    getNavLinks(),
    getMenuItems(),
    getReviews(),
    getActiveSnippets("body_start"),
    getActiveSnippets("body_end"),
  ]);

  // LocalBusiness structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: settings?.business_name,
    image: settings?.hero_image_url,
    telephone: settings?.phone,
    email: settings?.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings?.address_line1,
      addressLocality: settings?.address_line2,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: settings?.hours_weekday?.split(" - ")[0],
        closes: settings?.hours_weekday?.split(" - ")[1],
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: settings?.hours_weekend?.split(" - ")[0],
        closes: settings?.hours_weekend?.split(" - ")[1],
      },
    ],
  };

  return (
    <>
      <ThemeVars />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <a href="#hero-header" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:text-black focus:p-4">
        Skip to content
      </a>

      <Header navLinks={navLinks} settings={settings} />
      <CodeInjector snippets={bodyStartSnippets} />
      <main>
        <HeroStory settings={settings} bestSeller={menuItems.find((i) => i.is_best_seller) ?? null} />
        <Menu items={menuItems} />
        <Reviews reviews={reviews} />
        <LocationSection settings={settings} />
        <ContactSection settings={settings} />
      </main>
      <Footer settings={settings} />
      <CodeInjector snippets={bodyEndSnippets} />
    </>
  );
}
