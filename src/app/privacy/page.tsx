import Link from "next/link";
import { getSiteSettings } from "@/lib/data/public";

export const metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-caffeine-cream px-6 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto prose prose-stone">
        <Link href="/" className="text-sm font-semibold text-caffeine-accent hover:underline">
          ← Back to site
        </Link>
        <h1 className="font-cozy text-3xl font-bold text-caffeine-dark mt-6 mb-4">Privacy Policy</h1>
        <p className="text-stone-600 text-sm leading-relaxed">
          <strong>Placeholder content.</strong> Replace this page with your business&apos;s actual privacy policy
          before launch. At minimum, it should explain what personal data you collect (e.g. names and emails
          submitted through the contact form), how it&apos;s stored, and how people can request it be deleted.
          A generator like{" "}
          <a href="https://www.termsfeed.com" target="_blank" rel="noopener noreferrer" className="text-caffeine-accent underline">
            TermsFeed
          </a>{" "}
          can help, or consult a lawyer for anything handling EU/UK visitors (GDPR) or California residents (CCPA).
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
