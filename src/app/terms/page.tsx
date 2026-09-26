import Link from "next/link";
import { getSiteSettings, getLegalPage } from "@/lib/data/public";
import VisitTracker from "@/components/site/VisitTracker";
import LegalPageBody from "@/components/site/LegalPageBody";

export const metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const [settings, page] = await Promise.all([getSiteSettings(), getLegalPage("terms")]);

  return (
    <div className="min-h-screen bg-caffeine-cream px-6 py-16 sm:py-24">
      <VisitTracker />
      <div className="max-w-2xl mx-auto prose prose-stone">
        <Link href="/" className="text-sm font-semibold text-caffeine-accent hover:underline">
          ← Back to site
        </Link>
        <h1 className="font-cozy text-3xl font-bold text-caffeine-dark mt-6 mb-4">{page?.title || "Terms of Service"}</h1>

        {page?.content ? (
          <LegalPageBody content={page.content} />
        ) : (
          <p className="text-stone-600 text-sm leading-relaxed">
            <strong>Placeholder content.</strong> Replace this page with your business&apos;s actual terms before
            launch — covering acceptable use of the site, disclaimers about menu/pricing accuracy, and any liability
            limitations relevant to your business. Editable in Admin → Legal Pages.
          </p>
        )}

        {settings?.email && (
          <p className="text-stone-600 text-sm mt-4">
            Questions? Contact <a href={`mailto:${settings.email}`} className="text-caffeine-accent underline">{settings.email}</a>.
          </p>
        )}
      </div>
    </div>
  );
}
