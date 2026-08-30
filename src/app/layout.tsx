import type { Metadata } from "next";
import Script from "next/script";
import { Comfortaa, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import CodeInjector from "@/components/site/CodeInjector";

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

export const metadata: Metadata = {
  title: {
    default: "Caffeine | Cozy Craft Coffee",
    template: "%s | Caffeine",
  },
  description: "A cozy neighborhood coffee shop serving carefully roasted beans and fresh pastries.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: headSnippets } = await supabase
    .from("custom_code_snippets")
    .select("id, code")
    .eq("location", "head")
    .eq("is_active", true);

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  return (
    <html lang="en" className={`${comfortaa.variable} ${plusJakarta.variable} h-full antialiased scroll-smooth`}>
      <head>
        {/* FontAwesome only loads the icons actually referenced via CSS-in-JS tree-shaking
            would be ideal, but for now this is scoped to just the social icon set. */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <CodeInjector snippets={headSnippets ?? []} />
      </head>
      <body className="min-h-full flex flex-col font-body text-sm sm:text-base lg:text-lg selection:bg-caffeine-accent selection:text-white">
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
