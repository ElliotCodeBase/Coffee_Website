import type { Metadata } from "next";
import { Suspense } from "react";
import { getSiteSettings, getNavLinks, getMenuItems } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";
import SectionErrorBoundary from "@/components/shared/SectionErrorBoundary";
import Header from "@/components/site/Header";
import HeroStory from "@/components/site/HeroStory";
import Menu from "@/components/site/Menu";
import LocationSection from "@/components/site/LocationSection";
import ContactSection from "@/components/site/ContactSection";
import Footer from "@/components/site/Footer";
import ThemeVars from "@/components/site/ThemeVars";
import CodeInjector from "@/components/site/CodeInjector";
import VisitTracker from "@/components/site/VisitTracker";

async function getActiveSnippets(location: "head" | "body_start" | "body_end") {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("custom_code_snippets")
      .select("id, code")
      .eq("location", location)
      .eq("is_active", true);
    if (error) {
      console.error("getActiveSnippets error:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("getActiveSnippets threw:", err instanceof Error ? err.message : err);
    return [];
  }
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

/* The header's own data (business name/logo, nav links) is fetched here,
   independently of everything else the page needs. getSiteSettings() and
   getNavLinks() are wrapped (see src/lib/data/public.ts) so a query
   failure or a dropped connection resolves to null/[] instead of
   throwing — and getSiteSettings() is request-cached, so this doesn't
   cost a second query beyond the one PageBody also makes. */
async function HeaderSection() {
  const [settings, navLinks] = await Promise.all([getSiteSettings(), getNavLinks()]);
  return <Header navLinks={navLinks} settings={settings} />;
}

/* Rendered only if HeaderSection still manages to throw (e.g. an error
   Suspense itself can't paper over) or while it's loading. Deliberately
   static — no live data, no scroll listener — so it can never depend on
   whatever just failed. It keeps the "skip to content" target and the
   site name visible and the page usable while the rest loads or recovers. */
function HeaderFallback() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-18 lg:h-22 flex items-center bg-caffeine-dark/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 lg:px-12">
      <span className="font-cozy font-bold text-lg sm:text-xl lg:text-3xl text-white">Caffeine</span>
    </header>
  );
}

/* Everything below the header: hero, menu, location, contact, footer,
   theme variables, visit tracking, and injected custom code. This is a
   separate Suspense/error boundary from the header on purpose — if a
   query here is slow (e.g. the database is mid-migration and a table is
   briefly locked) or fails outright, that only affects this region.
   The header, above, keeps rendering and stays interactive regardless. */
async function PageBody() {
  const [settings, menuItems, bodyStartSnippets, bodyEndSnippets] = await Promise.all([
    getSiteSettings(),
    getMenuItems(),
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
      <VisitTracker />
      {/* JSON.stringify does not escape "<", so a business name or address containing
          "</script><script>…" would end this tag and run on every visitor's page.
          These values are editable by any admin, so escape "<" as \u003c. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <CodeInjector snippets={bodyStartSnippets} />
      <main>
        <HeroStory settings={settings} />
        <Menu items={menuItems} />
        <LocationSection settings={settings} />
        <ContactSection settings={settings} />
      </main>
      <Footer settings={settings} />
      <CodeInjector snippets={bodyEndSnippets} />
    </>
  );
}

/* Shown only if PageBody itself fails outright (not just slow — Suspense's
   own fallback below handles "slow"). The header stays up throughout, so
   this only needs to tell a visitor the rest of the page hit a problem. */
function PageBodyFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-24 text-center">
      <p className="text-stone-600 text-sm sm:text-base">
        This page is having trouble loading right now. Please refresh, or check back shortly.
      </p>
    </main>
  );
}

export default function HomePage() {
  return (
    <>
      <a href="#hero-header" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:text-black focus:p-4">
        Skip to content
      </a>

      <SectionErrorBoundary fallback={<HeaderFallback />}>
        <Suspense fallback={<HeaderFallback />}>
          <HeaderSection />
        </Suspense>
      </SectionErrorBoundary>

      <SectionErrorBoundary fallback={<PageBodyFallback />}>
        <Suspense fallback={null}>
          <PageBody />
        </Suspense>
      </SectionErrorBoundary>
    </>
  );
}
