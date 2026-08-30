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
    <section id="contact" className="relative py-24 lg:py-36 bg-caffeine-cream text-caffeine-dark overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-12 lg:px-20 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="inline-block text-xs uppercase font-bold tracking-widest text-caffeine-accent bg-caffeine-tan border border-stone-300 px-4 py-1.5 rounded-2xl mb-4">
                Drop a Line
              </span>
              <h2 className="font-cozy text-3xl sm:text-5xl lg:text-6xl font-bold text-caffeine-dark leading-tight">
                Let&apos;s talk coffee.
              </h2>
              <p className="text-stone-600 text-sm sm:text-base lg:text-lg font-normal mt-4 leading-relaxed">
                Got questions about our roasts, want to chat about catering a private event, or just want to say hi?
                Send us a message below.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {settings?.phone && (
                <a
                  href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                  className="group flex items-center gap-5 p-4 sm:p-5 rounded-3xl bg-caffeine-tan border border-stone-300/80 hover:border-caffeine-accent hover:bg-stone-200/80 transition-all duration-300 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-caffeine-accent text-amber-200 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-stone-500 tracking-wider">Give us a call</p>
                    <p className="text-base sm:text-lg font-semibold text-caffeine-dark group-hover:text-caffeine-accent transition-colors">
                      {settings.phone}
                    </p>
                  </div>
                </a>
              )}

              {settings?.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="group flex items-center gap-5 p-4 sm:p-5 rounded-3xl bg-caffeine-tan border border-stone-300/80 hover:border-caffeine-accent hover:bg-stone-200/80 transition-all duration-300 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-caffeine-accent text-amber-200 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold text-stone-500 tracking-wider">Send an email</p>
                    <p className="text-base sm:text-lg font-semibold text-caffeine-dark group-hover:text-caffeine-accent transition-colors">
                      {settings.email}
                    </p>
                  </div>
                </a>
              )}
            </div>

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
