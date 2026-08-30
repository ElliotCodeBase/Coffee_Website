import type { SiteSettings } from "@/types/database";

export default function LocationSection({ settings }: { settings: SiteSettings | null }) {
  const mapSrc =
    settings?.map_embed_url ||
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d43000!2d-122.3321!3d47.6062!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0!2zNDfCsDM2JzIyLjMiTiAxMjLCsDE5JzU1LjYiVw!5e0!3m2!1sen!2sus!4v1600000000000";

  return (
    <section id="location" className="relative py-20 lg:py-32 bg-caffeine-tan px-6 sm:px-12 lg:px-20 border-b border-stone-300">
      <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-3 gap-10 lg:gap-12">
        <div className="bg-caffeine-dark text-white p-8 lg:p-12 rounded-3xl flex flex-col justify-between space-y-8 shadow-xl">
          <div>
            <span className="inline-block text-xs uppercase font-bold tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/40 px-4 py-1.5 rounded-2xl mb-4">
              Find Us
            </span>
            <h2 className="font-cozy text-3xl sm:text-4xl lg:text-5xl font-bold mb-8">Hours & Location</h2>

            <div className="mb-8">
              <h3 className="text-amber-300 text-xs lg:text-sm font-bold uppercase tracking-wider mb-2">Address</h3>
              <p className="text-stone-100 font-semibold text-lg lg:text-xl">{settings?.address_line1}</p>
              <p className="text-stone-300 text-base lg:text-lg">{settings?.address_line2}</p>
            </div>

            <div>
              <h3 className="text-amber-300 text-xs lg:text-sm font-bold uppercase tracking-wider mb-2">
                When We&apos;re Open
              </h3>
              <div className="text-sm sm:text-base lg:text-lg space-y-3 text-stone-200">
                <p className="flex justify-between">
                  <span>Mon - Fri:</span> <span>{settings?.hours_weekday}</span>
                </p>
                <p className="flex justify-between">
                  <span>Sat - Sun:</span> <span>{settings?.hours_weekend}</span>
                </p>
              </div>
            </div>
          </div>

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(
              `${settings?.address_line1 || ""} ${settings?.address_line2 || ""}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-white hover:bg-stone-200 text-caffeine-dark font-bold py-4 rounded-2xl text-center transition-colors text-sm lg:text-base flex items-center justify-center gap-2 shadow-md"
          >
            <span>Open in Google Maps</span>
          </a>
        </div>

        <div className="lg:col-span-2 min-h-[350px] lg:min-h-[450px] bg-stone-300 rounded-3xl overflow-hidden relative shadow-xl border border-stone-300">
          <iframe
            title="Coffee Shop Location Map"
            src={mapSrc}
            className="w-full h-full absolute inset-0 border-0"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
