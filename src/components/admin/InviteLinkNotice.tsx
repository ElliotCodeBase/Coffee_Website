"use client";

import { useState } from "react";
import AdminButton from "@/components/admin/AdminButton";

/* Shown when an account was created but Supabase couldn't email the invite.
   The admin copies the link and sends it to the person themselves. The link
   lets whoever opens it set a password for that account, so it is shown only
   here, once, to the admin who created the invite. */
export default function InviteLinkNotice({ link, notice }: { link: string; notice?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard can be blocked; the field below is selectable as a fallback. */
    }
  }

  return (
    <div role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-bold text-amber-900">Account created, but the email wasn&apos;t sent</p>
      {notice && <p className="mt-1 text-xs text-amber-800">{notice}</p>}
      <p className="mt-2 text-xs text-amber-800">
        Send this link to the new team member yourself. It lets them set their password, so share it privately.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Invite link"
          className="min-w-0 flex-1 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs text-stone-700"
        />
        <AdminButton type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? "Copied" : "Copy link"}
        </AdminButton>
      </div>
    </div>
  );
}
