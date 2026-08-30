import Link from "next/link";
import { getSiteSettings } from "@/lib/data/public";

export const metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-caffeine-cream px-6 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto prose prose-stone">
        <Link href="/" className="text-sm font-semibold text-caffeine-accent hover:underline">
          ← Back to site
        </Link>
        <h1 className="font-cozy text-3xl font-bold text-caffeine-dark mt-6 mb-4">Terms of Service</h1>
        <p className="text-stone-600 text-sm leading-relaxed">
          <strong>Placeholder content.</strong> Replace this page with your business&apos;s actual terms before
          launch — covering acceptable use of the site, disclaimers about menu/pricing accuracy, and any liability
          limitations relevant to your business.
        </p>
        {settings?.email && (
          <p className="text-stone-600 text-sm mt-4">
            Questions? Contact <a href={`mailto:${settings.email}`} className="text-caffeine-accent underline">{settings.email}</a>.
          </p>
        )}
      </div>
    </div>
  );
}
