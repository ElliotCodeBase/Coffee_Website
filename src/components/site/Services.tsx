import type { ServiceItem } from "@/types/database";
import ServiceIcon from "@/components/site/ServiceIcon";

/* Static fallback so the section still looks intentional before an admin
   has added any rows (matches the pattern getMenuItems/getNavLinks use
   elsewhere: an empty DB result renders sensible defaults, not a blank
   section). Real content always wins once service_items has rows. */
const FALLBACK_SERVICES: Pick<ServiceItem, "id" | "title" | "description" | "icon">[] = [
  { id: "fallback-1", title: "Espresso Bar", description: "Hand-pulled shots from small-batch, in-house roasted beans.", icon: "coffee" },
  { id: "fallback-2", title: "Fresh Pastries", description: "Baked daily — croissants, muffins, and seasonal specials.", icon: "pastry" },
  { id: "fallback-3", title: "Cozy Seating", description: "A warm room built for slowing down, working, or catching up.", icon: "seat" },
  { id: "fallback-4", title: "Loyalty Rewards", description: "Every visit gets you closer to a free drink on us.", icon: "award" },
];

export default function Services({ items }: { items: ServiceItem[] }) {
  const visible = items.filter((i) => i.is_visible);
  const list = visible.length > 0 ? visible : FALLBACK_SERVICES;

  return (
    <section
      id="services"
      className="relative scroll-mt-16 sm:scroll-mt-20 lg:scroll-mt-24 py-14 sm:py-20 lg:py-28 bg-caffeine-dark px-5 sm:px-12 lg:px-20 overflow-hidden"
    >
      {/* One soft accent blob, per the "spend the boldness in one place" cue
          used elsewhere on the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/2 -translate-y-1/2 w-[50vw] max-w-xl aspect-square rounded-full bg-caffeine-accent/15 blur-3xl"
      />

      <div className="relative max-w-screen-2xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 lg:mb-16">
          <span className="inline-block text-[11px] sm:text-xs uppercase font-bold tracking-widest text-caffeine-gold bg-white/5 border border-white/10 px-3.5 sm:px-4 py-1.5 rounded-lg mb-3 sm:mb-4">
            Features
          </span>
          <h2 className="font-cozy text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Our Services
          </h2>
          <p className="text-xs sm:text-base lg:text-lg text-stone-400 font-normal">
            A few of the things that make a stop here worth it.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {list.map((item) => (
            <div
              key={item.id}
              className="group rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-4 sm:p-6 lg:p-7 transition-colors"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-caffeine-accent/15 text-caffeine-gold flex items-center justify-center mb-3 sm:mb-5 group-hover:bg-caffeine-accent/25 transition-colors">
                <ServiceIcon icon={item.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-cozy text-sm sm:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-[11px] sm:text-sm text-stone-400 leading-relaxed">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
