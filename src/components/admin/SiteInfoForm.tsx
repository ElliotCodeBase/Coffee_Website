"use client";

import { useState, useTransition } from "react";
import type { SiteSettings, ImageHistoryEntry, ImageHistoryField } from "@/types/database";
import { updateSiteSettings } from "@/lib/actions/site-settings";
import ImageUploadField from "@/components/admin/ImageUploadField";
import type { SiteInfoTab } from "@/components/admin/SiteInfoManager";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  textarea = false,
  placeholder,
  hint,
  maxLength,
  onInput,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  textarea?: boolean;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
  onInput?: (value: string) => void;
}) {
  const base =
    "w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-caffeine-dark placeholder-stone-400 outline-none transition-colors focus:border-caffeine-dark focus:ring-2 focus:ring-caffeine-dark/20";

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-500">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue || ""}
          rows={3}
          maxLength={maxLength}
          placeholder={placeholder}
          onInput={(e) => onInput?.(e.currentTarget.value)}
          className={`${base} resize-y`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue || ""}
          maxLength={maxLength}
          placeholder={placeholder}
          onInput={(e) => onInput?.(e.currentTarget.value)}
          className={base}
        />
      )}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-stone-400">{hint}</p>}
    </div>
  );
}

/**
 * One tab's worth of fields. Kept mounted (just visually hidden) when its
 * tab isn't active — everything lives in a single <form>, so unmounting
 * would silently drop those fields from the submitted FormData and the
 * server action would null them out.
 */
function Panel({
  id,
  active,
  title,
  description,
  children,
}: {
  id: SiteInfoTab;
  active: boolean;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`site-info-panel-${id}`}
      aria-labelledby={`site-info-tab-${id}`}
      hidden={!active}
      className={active ? "space-y-5" : "hidden"}
    >
      <div className="border-b border-stone-100 pb-4">
        <h2 className="font-cozy text-lg font-bold text-caffeine-dark">{title}</h2>
        <p className="mt-0.5 text-sm text-stone-500">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export default function SiteInfoForm({
  settings,
  imageHistory,
  activeTab,
}: {
  settings: SiteSettings | null;
  imageHistory?: Record<ImageHistoryField, ImageHistoryEntry[]>;
  activeTab: SiteInfoTab;
}) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dirty, setDirty] = useState(false);
  const [metaLength, setMetaLength] = useState((settings?.meta_description || "").length);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setStatus("idle");
    startTransition(async () => {
      const result = await updateSiteSettings(formData);
      if (result.error) {
        setStatus("error");
        setErrorMsg(result.error);
      } else {
        setStatus("success");
        setDirty(false);
      }
    });
  }

  function markDirty() {
    setDirty(true);
    setStatus("idle");
  }

  return (
    <form
      action={handleSubmit}
      onInput={markDirty}
      onChange={markDirty}
      className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8"
    >
      <Panel
        id="brand"
        active={activeTab === "brand"}
        title="Brand"
        description="The name and logo shown in the header, the browser tab, and search results."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Business name" name="business_name" defaultValue={settings?.business_name} />
          <Field label="Tagline" name="tagline" defaultValue={settings?.tagline} />
        </div>
        <ImageUploadField
          name="logo_url"
          label="Logo"
          defaultValue={settings?.logo_url}
          altFieldName="logo_alt"
          altDefaultValue={settings?.logo_alt}
          historyFieldName="logo_url"
          history={imageHistory?.logo_url}
        />
      </Panel>

      <Panel
        id="hero"
        active={activeTab === "hero"}
        title="Hero section"
        description="The full-screen opening image and headline visitors see first."
      >
        <ImageUploadField
          name="hero_image_url"
          label="Hero / header image"
          defaultValue={settings?.hero_image_url}
          historyFieldName="hero_image_url"
          history={imageHistory?.hero_image_url}
        />
        <Field label="Headline" name="hero_headline" defaultValue={settings?.hero_headline} />
        <Field
          label="Subtext"
          name="hero_subtext"
          defaultValue={settings?.hero_subtext}
          textarea
          hint="One or two sentences. Also used as the fallback search-engine description if you leave the SEO field blank."
        />
      </Panel>

      <Panel
        id="story"
        active={activeTab === "story"}
        title="Our Story"
        description="Revealed behind the hero image as it splits apart on scroll."
      >
        <ImageUploadField
          name="about_image_url"
          label="Our Story background image"
          defaultValue={settings?.about_image_url}
          historyFieldName="about_image_url"
          history={imageHistory?.about_image_url}
        />
        <p className="-mt-2 text-xs text-stone-400">Leave blank to reuse the hero image.</p>
        <Field label="Headline" name="about_headline" defaultValue={settings?.about_headline} />
        <Field label="Body text" name="about_body" defaultValue={settings?.about_body} textarea />
      </Panel>

      <Panel
        id="location"
        active={activeTab === "location"}
        title="Location & hours"
        description="Powers the Visit section, the embedded map, and your search-listing opening hours."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Address line 1" name="address_line1" defaultValue={settings?.address_line1} />
          <Field label="Address line 2" name="address_line2" defaultValue={settings?.address_line2} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Weekday hours"
            name="hours_weekday"
            defaultValue={settings?.hours_weekday}
            placeholder="6:30 AM - 6:00 PM"
            hint="Keep the “open - close” dash format — it's parsed for search engines."
          />
          <Field
            label="Weekend hours"
            name="hours_weekend"
            defaultValue={settings?.hours_weekend}
            placeholder="7:30 AM - 7:00 PM"
          />
        </div>
        <Field
          label="Google Maps embed URL"
          name="map_embed_url"
          defaultValue={settings?.map_embed_url}
          placeholder="https://www.google.com/maps/embed?..."
          hint="In Google Maps: Share → Embed a map → copy the URL inside src=&quot;...&quot;."
        />
      </Panel>

      <Panel
        id="contact"
        active={activeTab === "contact"}
        title="Contact details"
        description="Shown in the Contact section and the footer, and used for click-to-call and click-to-email links."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" name="phone" defaultValue={settings?.phone} type="tel" />
          <Field label="Email" name="email" defaultValue={settings?.email} type="email" />
        </div>
      </Panel>

      <Panel
        id="social"
        active={activeTab === "social"}
        title="Social links"
        description="Leave a field blank to hide that icon from the site."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Facebook URL" name="social_facebook" defaultValue={settings?.social_facebook} placeholder="https://facebook.com/…" />
          <Field label="Twitter / X URL" name="social_twitter" defaultValue={settings?.social_twitter} placeholder="https://x.com/…" />
          <Field label="Instagram URL" name="social_instagram" defaultValue={settings?.social_instagram} placeholder="https://instagram.com/…" />
          <Field label="LinkedIn URL" name="social_linkedin" defaultValue={settings?.social_linkedin} placeholder="https://linkedin.com/company/…" />
        </div>
        <p className="text-xs text-stone-400">
          Must start with <code className="rounded bg-stone-100 px-1 py-0.5">https://</code> — anything else is rejected when you save.
        </p>
      </Panel>

      <Panel
        id="seo"
        active={activeTab === "seo"}
        title="Footer & SEO"
        description="Copyright line and the description search engines show under your result."
      >
        <Field label="Footer copyright text" name="footer_copyright" defaultValue={settings?.footer_copyright} />
        <Field
          label="Meta description"
          name="meta_description"
          defaultValue={settings?.meta_description}
          textarea
          maxLength={320}
          onInput={(v) => setMetaLength(v.length)}
          hint={`${metaLength}/160 characters — Google typically truncates past 160.`}
        />
      </Panel>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-10 mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-caffeine-dark bg-caffeine-dark px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-caffeine-card active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>

        {status === "success" && (
          <span className="text-sm font-semibold text-green-700">Saved — your site is updated.</span>
        )}
        {status === "error" && <span className="text-sm font-semibold text-red-600">{errorMsg}</span>}
        {status === "idle" && dirty && (
          <span className="text-sm font-medium text-amber-600">Unsaved changes</span>
        )}
        {status === "idle" && !dirty && (
          <span className="text-sm text-stone-400">Saves every tab at once.</span>
        )}
      </div>
    </form>
  );
}
