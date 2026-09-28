"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreSiteImage, deleteImageHistoryEntry } from "@/lib/actions/site-settings";
import type { ImageHistoryDiagnostics } from "@/lib/data/public";
import type { ImageHistoryField } from "@/types/database";
import AdminButton from "@/components/admin/AdminButton";

const FIELD_LABELS: Record<ImageHistoryField, string> = {
  logo_url: "Logo",
  hero_image_url: "Hero / header image",
  about_image_url: "Our Story image",
  favicon_url: "Favicon",
};

function DiagnosticsBanner({ diagnostics }: { diagnostics: ImageHistoryDiagnostics }) {
  if (diagnostics.status === "ok") return null;

  const copy =
    diagnostics.status === "missing_table"
      ? {
          title: "Image history isn't set up on this database yet.",
          body: "The image_history table doesn't exist. Run supabase/migration_add_image_history.sql in the Supabase SQL editor, then reload this page.",
        }
      : diagnostics.status === "denied"
        ? {
            title: "Your account can't read image history.",
            body: 'Row Level Security blocked this query. Check the "admin manage image_history" policy in Supabase, and confirm your profile role is admin or developer.',
          }
        : {
            title: "Couldn't load image history.",
            body: diagnostics.status === "error" ? diagnostics.message : "Unknown error.",
          };

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="text-sm text-amber-900">
        <p className="font-bold">{copy.title}</p>
        <p className="mt-0.5">{copy.body}</p>
      </div>
    </div>
  );
}

export default function ImageHistoryManager({ diagnostics }: { diagnostics: ImageHistoryDiagnostics }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const router = useRouter();

  const entries = diagnostics.entries;

  function handleRestore(fieldName: ImageHistoryField, imageUrl: string, id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await restoreSiteImage(fieldName, imageUrl);
      if (result.error) setError(result.error);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this saved version? This cannot be undone.")) return;
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteImageHistoryEntry(id);
      if (result.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div>
      <DiagnosticsBanner diagnostics={diagnostics} />

      {error && (
        <div className="mb-4 text-sm text-red-600 font-semibold bg-red-50 rounded-lg px-4 py-3 border border-red-200">
          {error}
        </div>
      )}

      {diagnostics.status === "ok" && entries.length === 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
          <p className="text-sm text-stone-400 font-medium">
            Nothing here yet — replacing a logo, hero, or story image from Site Info will show up in this list.
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-4 p-4">
              <div className="relative w-20 aspect-[4/3] shrink-0 rounded-md overflow-hidden border border-stone-200 bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-caffeine-dark">{FIELD_LABELS[entry.field_name] || entry.field_name}</p>
                <p className="text-xs text-stone-400 mt-0.5">{new Date(entry.replaced_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(entry.field_name, entry.image_url, entry.id)}
                  disabled={isPending && pendingId === entry.id}
                >
                  {isPending && pendingId === entry.id ? "Restoring…" : "Restore"}
                </AdminButton>
                <AdminButton
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(entry.id)}
                  disabled={isPending && pendingId === entry.id}
                >
                  Delete
                </AdminButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
