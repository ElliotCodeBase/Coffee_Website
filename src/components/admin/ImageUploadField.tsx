"use client";

import { useState, useTransition, useRef } from "react";
import { uploadImage } from "@/lib/actions/upload";

interface Props {
  name: string;
  label: string;
  defaultValue?: string | null;
  altFieldName?: string;
  altDefaultValue?: string | null;
}

export default function ImageUploadField({ name, label, defaultValue, altFieldName, altDefaultValue }: Props) {
  const [url, setUrl] = useState(defaultValue || "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      const result = await uploadImage(fd);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        setUrl(result.url);
      }
    });
  }

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">{label}</label>

      <div className="flex items-start gap-4">
        <div className="w-24 h-24 rounded-2xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input type="hidden" name={name} value={url} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="text-sm font-semibold bg-stone-100 hover:bg-stone-200 disabled:opacity-60 px-4 py-2 rounded-xl transition-colors"
          >
            {isPending ? "Uploading…" : url ? "Replace image" : "Upload image"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <p className="text-xs text-stone-400">JPG, PNG, WebP, GIF, or SVG. Max 5MB.</p>

          {altFieldName && (
            <input
              type="text"
              name={altFieldName}
              defaultValue={altDefaultValue || ""}
              placeholder="Alt text (for accessibility & SEO)"
              className="w-full mt-2 px-3 py-2 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}
