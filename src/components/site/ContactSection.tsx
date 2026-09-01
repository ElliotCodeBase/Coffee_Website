import type { SiteSettings } from "@/types/database";
import ContactForm from "./ContactForm";

export default function ContactSection({ settings }: { settings: SiteSettings | null }) {
  const socials = [
    { key: "facebook", url: settings?.social_facebook, label: "Facebook", icon: "fa-facebook" },
    { key: "twitter", url: settings?.social_twitter, label: "Twitter", icon: "fa-twitter" },
    { key: "instagram", url: settings?.social_instagram, label: "Instagram", icon: "fa-instagram" },
    { key: "linkedin", url: settings?.social_linkedin, label: "LinkedIn", icon: "fa-linkedin" },
  ].filter((s) => s.url);

  return (
    <section id="contact" className="relative py-16 sm:py-24 lg:py-36 bg-caffeine-cream text-caffeine-dark overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-12 lg:px-20 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            <div>
              <span className="inline-block text-[11px] sm:text-xs uppercase font-bold tracking-widest text-caffeine-accent bg-caffeine-tan border border-stone-300 px-3.5 sm:px-4 py-1.5 rounded-2xl mb-3 sm:mb-4">
                Drop a Line
              </span>
              <h2 className="font-cozy text-2xl sm:text-5xl lg:text-6xl font-bold text-caffeine-dark leading-tight">
                Let&apos;s talk coffee.
              </h2>
              <p className="text-stone-600 text-xs sm:text-base lg:text-lg font-normal mt-3 sm:mt-4 leading-relaxed">
                Got questions about our roasts, want to chat about catering a private event, or just want to say hi?
                Send us a message below.
              </p>
            </div>

            {(settings?.phone || settings?.email) && (
              <div className="pt-2 border-t border-stone-300/70 divide-y divide-stone-300/70">
                {settings?.phone && (
                  <a
                    href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                    className="group flex items-baseline justify-between gap-4 py-4"
                  >
                    <span className="text-xs sm:text-sm text-stone-500 shrink-0">Ring us up</span>
                    <span className="text-base sm:text-xl font-semibold text-caffeine-dark group-hover:text-caffeine-accent transition-colors text-right">
                      {settings.phone}
                    </span>
                  </a>
                )}

                {settings?.email && (
                  <a
                    href={`mailto:${settings.email}`}
                    className="group flex items-baseline justify-between gap-4 py-4"
                  >
                    <span className="text-xs sm:text-sm text-stone-500 shrink-0">Or just email</span>
                    <span className="text-base sm:text-xl font-semibold text-caffeine-dark group-hover:text-caffeine-accent transition-colors text-right break-all">
                      {settings.email}
                    </span>
                  </a>
                )}
              </div>
            )}

            {socials.length > 0 && (
              <div>
                <p className="text-xs uppercase font-bold text-stone-500 tracking-wider mb-4">Follow along</p>
                <div className="flex items-center gap-3">
                  {socials.map((s) => (
                    <a
                      key={s.key}
                      href={s.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="w-11 h-11 rounded-2xl bg-caffeine-tan border border-stone-300 flex items-center justify-center text-caffeine-dark hover:bg-caffeine-accent hover:text-white transition-all text-lg"
                    >
                      <i className={`fab ${s.icon}`} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
