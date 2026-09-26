import type { Metadata } from "next";
import Script from "next/script";
import {
  Comfortaa,
  Plus_Jakarta_Sans,
  Playfair_Display,
  Inter,
  Fraunces,
  Poppins,
  DM_Serif_Display,
  DM_Sans,
  Space_Grotesk,
  Work_Sans,
  Cormorant_Garamond,
  Nunito_Sans,
  Quicksand,
} from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import CodeInjector from "@/components/site/CodeInjector";
import { getSiteSettings } from "@/lib/data/public";
import { buildSeoDefaults } from "@/lib/seo-defaults";

const comfortaa = Comfortaa({
  variable: "--font-cozy",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* The rest of the curated font pairings (see src/lib/theme-presets.ts).
   All of these are self-hosted at build time by next/font — nothing here
   makes a request to Google's servers at runtime. Loading the full set
   unconditionally (rather than only the currently-selected pairing) is
   what lets the admin switch fonts in Admin → Theme & Colors with zero
   redeploy: every font is already on the page, just not applied until its
   CSS variable is selected by ThemeVars.tsx. */
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["600", "700"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["500", "600", "700"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["500", "600", "700"] });
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", subsets: ["latin"], weight: ["400"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["500", "600", "700"] });
const workSans = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["600", "700"] });
const nunitoSans = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "500", "600"] });
const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"], weight: ["500", "600", "700"] });

const ALL_FONT_VARIABLES = [
  comfortaa.variable,
  plusJakarta.variable,
  playfair.variable,
  inter.variable,
  fraunces.variable,
  poppins.variable,
  dmSerif.variable,
  dmSans.variable,
  spaceGrotesk.variable,
  workSans.variable,
  cormorant.variable,
  nunitoSans.variable,
  quicksand.variable,
].join(" ");

/* Metadata is built from site_settings so the tab title and favicon follow
   what is saved in Admin → Site Info. getSiteSettings() never throws (it
   falls back to null) and is request-cached, so the home page's own
   generateMetadata reuses this same query. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const name = settings?.business_name || "Caffeine";
  const defaults = buildSeoDefaults(settings ?? {});
  const favicon = settings?.favicon_url || "/favicon.svg";

  return {
    title: {
      default: settings?.seo_title || defaults.seo_title,
      template: `%s | ${name}`,
    },
    description: settings?.meta_description || defaults.meta_description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    robots: { index: true, follow: true },
    icons: { icon: favicon, shortcut: favicon, apple: favicon },
  };
}

/* This layout wraps every route in the app — the public site and the
   entire /admin section alike — so a query here has the largest possible
   blast radius of anywhere in the codebase: if it throws, nothing
   renders anywhere, not even a route's own error.tsx (a layout's errors
   are caught by the *parent* segment's boundary, and this is already the
   root). Catch and fall back to no snippets rather than let that happen. */
async function getHeadSnippets() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("custom_code_snippets")
      .select("id, code")
      .eq("location", "head")
      .eq("is_active", true);
    if (error) {
      console.error("getHeadSnippets error:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("getHeadSnippets threw:", err instanceof Error ? err.message : err);
    return [];
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headSnippets = await getHeadSnippets();

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  return (
    <html lang="en" className={`${ALL_FONT_VARIABLES} h-full antialiased scroll-smooth`}>
      <head>
        {/* FontAwesome only loads the icons actually referenced via CSS-in-JS tree-shaking
            would be ideal, but for now this is scoped to just the social icon set. */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <CodeInjector snippets={headSnippets} />
      </head>
      <body className="min-h-full flex flex-col font-body text-sm sm:text-base lg:text-lg selection:bg-caffeine-accent selection:text-white">
        {/* No cookie-consent banner: nothing on this site currently sets a
            non-essential cookie. Visit analytics uses sessionStorage
            (src/components/site/VisitTracker.tsx), and the only cookie set
            anywhere is the Supabase auth session cookie, created only when
            you or staff log into /admin — a strictly-necessary cookie that
            doesn't require consent under GDPR/CCPA. If you later add real
            tracking (Google Analytics, ad pixels, etc.), add a consent
            banner here first. */}
        {children}
        {recaptchaSiteKey && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
