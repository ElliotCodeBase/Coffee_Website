"use client";

import { useState, useTransition } from "react";
import type { ThemeSettings } from "@/types/database";
import { updateTheme } from "@/lib/actions/developer";
import SaveButton from "@/components/admin/SaveButton";

function ColorField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-12 h-12 rounded-xl border border-stone-300 cursor-pointer"
        />
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 px-4 py-3 text-sm font-mono rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
        />
      </div>
    </div>
  );
}

export default function ThemeForm({ theme }: { theme: ThemeSettings | null }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setStatus("idle");
    startTransition(async () => {
      const result = await updateTheme(formData);
      setStatus(result.error ? "error" : "success");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-5">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark">Brand Colors</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <ColorField label="Dark background" name="color_dark" defaultValue={theme?.color_dark || "#1c120c"} />
          <ColorField label="Card background" name="color_card" defaultValue={theme?.color_card || "#291b13"} />
          <ColorField label="Cream background" name="color_cream" defaultValue={theme?.color_cream || "#f9f4ee"} />
          <ColorField label="Tan background" name="color_tan" defaultValue={theme?.color_tan || "#f0e3d5"} />
          <ColorField label="Accent (buttons/links)" name="color_accent" defaultValue={theme?.color_accent || "#432516"} />
          <ColorField label="Gold (stars/highlights)" name="color_gold" defaultValue={theme?.color_gold || "#d99b26"} />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-5">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark">Fonts</h2>
        <p className="text-xs text-stone-400 -mt-3">
          Must be exact Google Fonts family names (e.g. &quot;Comfortaa&quot;, &quot;Playfair Display&quot;). Changing
          fonts here requires the developer to also add them in <code>layout.tsx</code> for full effect — this
          controls the CSS variable but the font file itself is loaded at build time.
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Heading font
            </label>
            <input
              name="font_heading"
              defaultValue={theme?.font_heading || "Comfortaa"}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Body font</label>
            <input
              name="font_body"
              defaultValue={theme?.font_body || "Plus Jakarta Sans"}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SaveButton pending={isPending} />
        {status === "success" && <span className="text-sm font-semibold text-green-700">Saved! Refresh the live site to see changes.</span>}
        {status === "error" && <span className="text-sm font-semibold text-red-600">Failed to save.</span>}
      </div>
    </form>
  );
}
