"use client";

import { useState, useTransition } from "react";
import type { ThemeSettings } from "@/types/database";
import { updateTheme } from "@/lib/actions/developer";
import { COLOR_PALETTES, FONT_PAIRINGS, DEFAULT_FONT_PAIRING } from "@/lib/theme-presets";
import SaveButton from "@/components/admin/SaveButton";

type ColorKey = "color_dark" | "color_card" | "color_cream" | "color_tan" | "color_accent" | "color_gold";

const COLOR_LABELS: Record<ColorKey, string> = {
  color_dark: "Header & footer background",
  color_card: "Card background",
  color_cream: "Body background",
  color_tan: "Secondary background",
  color_accent: "Buttons & links",
  color_gold: "Highlights (stars, badges)",
};

function ColorField({
  colorKey,
  value,
  onChange,
}: {
  colorKey: ColorKey;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
        {COLOR_LABELS[colorKey]}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-md border border-stone-300 cursor-pointer shrink-0"
        />
        <input
          type="text"
          name={colorKey}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-3 text-sm font-mono rounded-md border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
        />
      </div>
    </div>
  );
}

export default function ThemeForm({ theme }: { theme: ThemeSettings | null }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const [colors, setColors] = useState<Record<ColorKey, string>>({
    color_dark: theme?.color_dark || "#1c120c",
    color_card: theme?.color_card || "#291b13",
    color_cream: theme?.color_cream || "#f9f4ee",
    color_tan: theme?.color_tan || "#f0e3d5",
    color_accent: theme?.color_accent || "#432516",
    color_gold: theme?.color_gold || "#d99b26",
  });
  const [activePalette, setActivePalette] = useState<string | null>(null);
  const [fontPairing, setFontPairing] = useState(theme?.font_pairing || DEFAULT_FONT_PAIRING);

  function applyPalette(paletteKey: string) {
    const palette = COLOR_PALETTES.find((p) => p.key === paletteKey);
    if (!palette) return;
    setColors({ ...palette.colors });
    setActivePalette(paletteKey);
  }

  function updateColor(key: ColorKey, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }));
    setActivePalette(null); // manual edit — no longer exactly matches a preset
  }

  function handleSubmit(formData: FormData) {
    setStatus("idle");
    startTransition(async () => {
      const result = await updateTheme(formData);
      setStatus(result.error ? "error" : "success");
      setErrorMsg(result.error || "");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-lg border border-stone-200 p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="font-cozy font-bold text-lg text-caffeine-dark">Color palette</h2>
          <p className="text-xs text-stone-400 mt-1">
            Pick a preset to fill every color at once, then fine-tune any of them below.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COLOR_PALETTES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPalette(p.key)}
              className={`rounded-lg border-2 p-3 text-left transition-colors ${
                activePalette === p.key ? "border-caffeine-dark" : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <span className="flex gap-1 mb-2">
                {Object.values(p.colors).map((c, i) => (
                  <span key={i} className="w-4 h-4 rounded-full border border-black/10" style={{ background: c }} />
                ))}
              </span>
              <span className="block text-xs font-semibold text-caffeine-dark">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-stone-200 p-6 sm:p-8 space-y-5">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark">Fine-tune colors</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {(Object.keys(colors) as ColorKey[]).map((key) => (
            <ColorField key={key} colorKey={key} value={colors[key]} onChange={(v) => updateColor(key, v)} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-stone-200 p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="font-cozy font-bold text-lg text-caffeine-dark">Font pairing</h2>
          <p className="text-xs text-stone-400 mt-1">
            Every option here is already built into the site — no code changes or redeploy needed to switch.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {FONT_PAIRINGS.map((f) => (
            <label
              key={f.key}
              className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                fontPairing === f.key ? "border-caffeine-dark bg-stone-50" : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <input
                type="radio"
                name="font_pairing"
                value={f.key}
                checked={fontPairing === f.key}
                onChange={() => setFontPairing(f.key)}
                className="mt-1 accent-caffeine-dark"
              />
              <span>
                <span
                  className="block text-base font-bold text-caffeine-dark"
                  style={{ fontFamily: `var(${f.heading}), ${f.headingFallback}` }}
                >
                  {f.label.split(" + ")[0]}
                </span>
                <span
                  className="block text-sm text-stone-500"
                  style={{ fontFamily: `var(${f.body}), ${f.bodyFallback}` }}
                >
                  {f.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SaveButton pending={isPending} />
        {status === "success" && (
          <span className="text-sm font-semibold text-green-700">Saved! Your site is updated.</span>
        )}
        {status === "error" && <span className="text-sm font-semibold text-red-600">{errorMsg || "Failed to save."}</span>}
      </div>
    </form>
  );
}
