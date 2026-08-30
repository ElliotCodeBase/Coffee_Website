"use client";

import { useState, useTransition } from "react";
import type { SiteSettings } from "@/types/database";
import { updateSiteSettings } from "@/lib/actions/site-settings";
import ImageUploadField from "@/components/admin/ImageUploadField";
import SaveButton from "@/components/admin/SaveButton";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  textarea = false,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue || ""}
          rows={3}
          placeholder={placeholder}
          className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue || ""}
          placeholder={placeholder}
          className="w-full px-4 py-3 text-sm rounded-2xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
        />
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-5">
      <h2 className="font-cozy font-bold text-lg text-caffeine-dark">{title}</h2>
      {children}
    </div>
  );
}

export default function SiteInfoForm({ settings }: { settings: SiteSettings | null }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
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
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-3xl">
      <SectionCard title="Brand">
        <Field label="Business name" name="business_name" defaultValue={settings?.business_name} />
        <Field label="Tagline" name="tagline" defaultValue={settings?.tagline} />
        <ImageUploadField
          name="logo_url"
          label="Logo"
          defaultValue={settings?.logo_url}
          altFieldName="logo_alt"
          altDefaultValue={settings?.logo_alt}
        />
      </SectionCard>

      <SectionCard title="Hero Section">
        <ImageUploadField name="hero_image_url" label="Hero / header image" defaultValue={settings?.hero_image_url} />
        <Field label="Headline" name="hero_headline" defaultValue={settings?.hero_headline} />
        <Field label="Subtext" name="hero_subtext" defaultValue={settings?.hero_subtext} textarea />
      </SectionCard>

      <SectionCard title="Our Story / About">
        <Field label="Headline" name="about_headline" defaultValue={settings?.about_headline} />
        <Field label="Body text" name="about_body" defaultValue={settings?.about_body} textarea />
      </SectionCard>

      <SectionCard title="Location & Hours">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Address line 1" name="address_line1" defaultValue={settings?.address_line1} />
          <Field label="Address line 2" name="address_line2" defaultValue={settings?.address_line2} />
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Weekday hours" name="hours_weekday" defaultValue={settings?.hours_weekday} placeholder="6:30 AM - 6:00 PM" />
          <Field label="Weekend hours" name="hours_weekend" defaultValue={settings?.hours_weekend} placeholder="7:30 AM - 7:00 PM" />
        </div>
        <Field
          label="Google Maps embed URL"
          name="map_embed_url"
          defaultValue={settings?.map_embed_url}
          placeholder="https://www.google.com/maps/embed?..."
        />
        <p className="text-xs text-stone-400 -mt-3">
          In Google Maps: Share → Embed a map → copy the URL inside <code>src=&quot;...&quot;</code>.
        </p>
      </SectionCard>

      <SectionCard title="Contact Info">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Phone" name="phone" defaultValue={settings?.phone} type="tel" />
          <Field label="Email" name="email" defaultValue={settings?.email} type="email" />
        </div>
      </SectionCard>

      <SectionCard title="Social Links">
        <p className="text-xs text-stone-400 -mt-2">Leave blank to hide an icon from the site footer/contact section.</p>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Facebook URL" name="social_facebook" defaultValue={settings?.social_facebook} />
          <Field label="Twitter / X URL" name="social_twitter" defaultValue={settings?.social_twitter} />
          <Field label="Instagram URL" name="social_instagram" defaultValue={settings?.social_instagram} />
          <Field label="LinkedIn URL" name="social_linkedin" defaultValue={settings?.social_linkedin} />
        </div>
      </SectionCard>

      <SectionCard title="Footer & SEO">
        <Field label="Footer copyright text" name="footer_copyright" defaultValue={settings?.footer_copyright} />
        <Field
          label="Meta description (for search engines)"
          name="meta_description"
          defaultValue={settings?.meta_description}
          textarea
        />
      </SectionCard>

      <div className="flex items-center gap-4 sticky bottom-6">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-lg p-4 flex items-center gap-4">
          <SaveButton pending={isPending} />
          {status === "success" && <span className="text-sm font-semibold text-green-700">Saved!</span>}
          {status === "error" && <span className="text-sm font-semibold text-red-600">{errorMsg}</span>}
        </div>
      </div>
    </form>
  );
}
