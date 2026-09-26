"use client";

import { useState, useTransition } from "react";
import type { LegalPage, LegalPageSlug } from "@/types/database";
import { updateLegalPage } from "@/lib/actions/legal";
import SaveButton from "@/components/admin/SaveButton";

const PLACEHOLDER: Record<LegalPageSlug, string> = {
  terms: `Replace this with your business's actual terms of service before launch.

Cover things like: acceptable use of the site, disclaimers about menu/pricing accuracy, and any liability limitations relevant to your business.`,
  privacy: `Replace this with your business's actual privacy policy before launch.

At minimum, explain what personal data you collect (e.g. names and emails submitted through the contact form), how it's stored, and how people can request it be deleted. A generator like TermsFeed can help, or consult a lawyer for anything handling EU/UK visitors (GDPR) or California residents (CCPA).`,
};

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
        active ? "bg-caffeine-dark text-white" : "text-stone-600 hover:bg-stone-100"
      }`}
    >
      {label}
    </button>
  );
}

function PageEditor({ page, slug }: { page: LegalPage | null; slug: LegalPageSlug }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setStatus("idle");
    startTransition(async () => {
      const result = await updateLegalPage(formData);
      if (result.error) {
        setStatus("error");
        setErrorMsg(result.error);
      } else {
        setStatus("success");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">Page title</label>
        <input
          name="title"
          defaultValue={page?.title || (slug === "terms" ? "Terms of Service" : "Privacy Policy")}
          maxLength={120}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-caffeine-dark outline-none focus:border-caffeine-dark focus:ring-2 focus:ring-caffeine-dark/20"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">
          Page content
        </label>
        <textarea
          name="content"
          defaultValue={page?.content || ""}
          placeholder={PLACEHOLDER[slug]}
          rows={16}
          maxLength={20000}
          className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-caffeine-dark placeholder-stone-400 outline-none focus:border-caffeine-dark focus:ring-2 focus:ring-caffeine-dark/20"
        />
        <p className="mt-1.5 text-xs leading-relaxed text-stone-400">
          Plain text. Leave a blank line between paragraphs — that's all the formatting the public page uses, so
          there's no markup to get wrong.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <SaveButton pending={isPending} />
        {status === "success" && <span className="text-sm font-semibold text-green-700">Saved.</span>}
        {status === "error" && <span className="text-sm font-semibold text-red-600">{errorMsg}</span>}
      </div>
    </form>
  );
}

export default function LegalPagesForm({
  terms,
  privacy,
}: {
  terms: LegalPage | null;
  privacy: LegalPage | null;
}) {
  const [tab, setTab] = useState<LegalPageSlug>("terms");

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8">
      <div className="mb-6 flex gap-2 border-b border-stone-100 pb-4">
        <Tab label="Terms of Service" active={tab === "terms"} onClick={() => setTab("terms")} />
        <Tab label="Privacy Policy" active={tab === "privacy"} onClick={() => setTab("privacy")} />
      </div>
      <div className={tab === "terms" ? "" : "hidden"}>
        <PageEditor page={terms} slug="terms" />
      </div>
      <div className={tab === "privacy" ? "" : "hidden"}>
        <PageEditor page={privacy} slug="privacy" />
      </div>
    </div>
  );
}
