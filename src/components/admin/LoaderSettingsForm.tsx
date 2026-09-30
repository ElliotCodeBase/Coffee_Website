"use client";

import { useState, useTransition } from "react";
import type { ThemeSettings } from "@/types/database";
import { updateLoaderSettings } from "@/lib/actions/developer";
import SaveBar, { type SaveState } from "@/components/admin/SaveBar";
import LoaderClient from "@/components/site/LoaderClient";
import {
  loaderConfigFrom,
  LOADER_LABEL_MAX,
  LOADER_MAX_MS,
  LOADER_MIN_MS,
  type LoaderFrequency,
} from "@/lib/loader-config";

/* The loading animation has its own form and its own Save button, so it is
   saved independently of colors and fonts. */
export default function LoaderSettingsForm({ theme, businessName }: { theme: ThemeSettings | null; businessName: string }) {
  const initial = loaderConfigFrom(theme);
  const [on, setOn] = useState(initial.enabled);
  const [secs, setSecs] = useState(initial.durationMs / 1000);
  const [freq, setFreq] = useState<LoaderFrequency>(initial.frequency);
  const [showPct, setShowPct] = useState(initial.showPercent);
  const [label, setLabel] = useState(theme?.loader_label ?? "");
  const [run, setRun] = useState(0);

  const [save, setSave] = useState<SaveState>({ status: "idle" });
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  function touch() {
    setDirty(true);
    if (save.status !== "idle") setSave({ status: "idle" });
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateLoaderSettings(formData);
      if (result.error) {
        setSave({ status: "error", message: result.error });
      } else {
        setSave({ status: "success", savedAt: new Date() });
        setDirty(false);
      }
    });
  }

  return (
    <form action={handleSubmit} onChange={touch} className="max-w-3xl space-y-6">
      <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 sm:p-7">
        <div>
          <h2 className="font-cozy text-lg font-bold text-caffeine-dark">Loading animation</h2>
          <p className="mt-1 text-sm text-stone-500">
            What visitors see for a moment when they open the site: milk pours down the screen while a percentage counts up,
            then drips away to reveal the page. The milk uses the &ldquo;Milk drip under Our Story&rdquo; color.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 p-4">
          <input
            type="checkbox"
            name="loader_enabled"
            checked={on}
            onChange={(e) => setOn(e.target.checked)}
            className="h-5 w-5 accent-caffeine-dark"
          />
          <span>
            <span className="block text-sm font-bold text-caffeine-dark">Show the loading animation</span>
            <span className="block text-xs text-stone-500">Turn off to open the site straight away.</span>
          </span>
        </label>

        <fieldset disabled={!on} className={`space-y-6 ${on ? "" : "opacity-50"}`}>
          <div>
            <label htmlFor="loader_seconds" className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">
              How long: {secs.toFixed(1)} seconds
            </label>
            <input
              id="loader_seconds"
              type="range"
              name="loader_seconds"
              min={LOADER_MIN_MS / 1000}
              max={LOADER_MAX_MS / 1000}
              step={0.1}
              value={secs}
              onChange={(e) => setSecs(Number(e.target.value))}
              className="w-full accent-caffeine-dark"
            />
            <p className="mt-1 text-xs text-stone-400">
              The shortest time it stays up. If the page is slower to load, it waits at 94% until it&apos;s ready.
            </p>
          </div>

          <fieldset>
            <legend className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">How often</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["every", "Every time", "Each time the page opens or is refreshed."],
                  ["session", "Once per visit", "Only the first time someone opens the site in a tab."],
                ] as const
              ).map(([value, title, hint]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-colors ${
                    freq === value ? "border-caffeine-dark bg-stone-50" : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="loader_frequency"
                    value={value}
                    checked={freq === value}
                    onChange={() => setFreq(value)}
                    className="mt-1 accent-caffeine-dark"
                  />
                  <span>
                    <span className="block text-sm font-bold text-caffeine-dark">{title}</span>
                    <span className="block text-xs text-stone-500">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="loader_show_percent"
              checked={showPct}
              onChange={(e) => setShowPct(e.target.checked)}
              className="h-5 w-5 accent-caffeine-dark"
            />
            <span className="text-sm font-semibold text-caffeine-dark">Show the percentage number</span>
          </label>

          <div>
            <label htmlFor="loader_label" className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">
              Small text above the number
            </label>
            <input
              id="loader_label"
              type="text"
              name="loader_label"
              maxLength={LOADER_LABEL_MAX}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`Leave empty to use “${businessName}”`}
              className="w-full rounded-md border border-stone-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-caffeine-dark"
            />
          </div>
        </fieldset>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-7">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-cozy text-base font-bold text-caffeine-dark">Preview</h3>
            <p className="text-xs text-stone-400">Shows your current choices, even before you save.</p>
          </div>
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:border-caffeine-dark hover:text-caffeine-dark"
          >
            {run === 0 ? "Play preview" : "Replay"}
          </button>
        </div>
        <div className="relative h-72 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
          {run > 0 ? (
            <LoaderClient
              key={`${run}-${secs}-${showPct}-${label}`}
              config={{
                enabled: true,
                durationMs: Math.round(secs * 1000),
                frequency: "every",
                showPercent: showPct,
                label: label.trim() || businessName,
              }}
              preview
            />
          ) : (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-stone-400">
              Press &ldquo;Play preview&rdquo; to watch it.
            </p>
          )}
        </div>
      </div>

      <SaveBar pending={isPending} dirty={dirty} state={save} label="Save loading animation" />
    </form>
  );
}
