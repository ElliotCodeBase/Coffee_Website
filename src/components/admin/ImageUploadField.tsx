"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadImage } from "@/lib/actions/upload";
import { compressImage } from "@/lib/image-compress";
import { restoreSiteImage } from "@/lib/actions/site-settings";
import AdminButton from "@/components/admin/AdminButton";
import type { ImageHistoryEntry, ImageHistoryField } from "@/types/database";

interface Props {
  name: string;
  label: string;
  defaultValue?: string | null;
  altFieldName?: string;
  altDefaultValue?: string | null;
  // When provided, shows a "previous versions" strip below the upload
  // control the client can revert to. `historyFieldName` must match one
  // of the three fields the server actually archives history for.
  historyFieldName?: ImageHistoryField;
  history?: ImageHistoryEntry[];
}

export default function ImageUploadField({
  name,
  label,
  defaultValue,
  altFieldName,
  altDefaultValue,
  historyFieldName,
  history = [],
}: Props) {
  const [url, setUrl] = useState(defaultValue || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRestoring, startRestoreTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    startTransition(async () => {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("file", compressed);

      const result = await uploadImage(fd);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        setUrl(result.url);
      }
    });
  }

  function handleRestore(historyUrl: string) {
    if (!historyFieldName) return;
    setError(null);
    startRestoreTransition(async () => {
      // This saves immediately (unlike the file upload above, which just
      // stages a value into the form until "Save changes" is clicked) —
      // restoring is meant to take effect right away, and it archives
      // whatever's currently active first so it's never lost either way.
      const result = await restoreSiteImage(historyFieldName, historyUrl);
      if (result.error) {
        setError(result.error);
      } else {
        setUrl(historyUrl);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">{label}</label>

      <div className="flex items-start gap-4">
        {/* Preview uses the same 4:3 crop the menu cards and the public
            site render, so what you see here is what actually ships. */}
        <div className="relative w-28 sm:w-32 aspect-[4/3] rounded-md bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input type="hidden" name={name} value={url} />
          <AdminButton type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
            {isPending ? "Uploading…" : url ? "Replace image" : "Upload image"}
          </AdminButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <p className="text-xs text-stone-400">JPG, PNG, WebP or GIF. Max 5MB. Images are cropped to 4:3.</p>

          {altFieldName && (
            <input
              type="text"
              name={altFieldName}
              defaultValue={altDefaultValue || ""}
              placeholder="Alt text (for accessibility & SEO)"
              className="w-full mt-2 px-3 py-2 text-sm rounded-md border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
            />
          )}
        </div>
      </div>

      {historyFieldName && history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-stone-100">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
            Previous versions — click to bring one back
          </p>
          <div className="flex flex-wrap gap-2.5">
            {history.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => handleRestore(entry.image_url)}
                disabled={isRestoring || entry.image_url === url}
                title={new Date(entry.replaced_at).toLocaleString()}
                className="group relative w-20 aspect-[4/3] rounded-md overflow-hidden border border-stone-200 hover:border-caffeine-dark transition-colors disabled:opacity-40 disabled:cursor-default"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={entry.image_url} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
                {entry.image_url !== url && (
                  <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold uppercase">Restore</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
