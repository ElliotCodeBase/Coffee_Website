import type { ServiceItem } from "@/types/database";
import ServiceIcon from "@/components/site/ServiceIcon";

/* Static fallback so the section still looks intentional before an admin
   has added any rows. Real content always wins once service_items has rows. */
const FALLBACK_SERVICES: Pick<ServiceItem, "id" | "title" | "description" | "icon">[] = [
  { id: "fallback-1", title: "Espresso Bar", description: "Hand-pulled shots from small-batch, in-house roasted beans.", icon: "coffee" },
  { id: "fallback-2", title: "Fresh Pastries", description: "Baked daily — croissants, muffins, and seasonal specials.", icon: "pastry" },
  { id: "fallback-3", title: "Cozy Seating", description: "A warm room built for slowing down, working, or catching up.", icon: "seat" },
  { id: "fallback-4", title: "Loyalty Rewards", description: "Every visit gets you closer to a free drink on us.", icon: "award" },
];

/* Sits below Contact, just above the footer. Not a grid of identical
   cards: a heading that stays put on large screens while a ruled list of
   services scrolls past it, each row icon / name / description. */
export default function Services({ items }: { items: ServiceItem[] }) {
  const visible = items.filter((i) => i.is_visible);
  const list = visible.length > 0 ? visible : FALLBACK_SERVICES;

  return (
    <section
      id="services"
      className="relative scroll-mt-16 sm:scroll-mt-20 lg:scroll-mt-24 py-16 sm:py-24 lg:py-32 bg-caffeine-tan text-caffeine-dark px-5 sm:px-12 lg:px-20"
    >
      <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-4 lg:sticky lg:top-32 self-start">
          <h2 className="font-cozy text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-balance">
            Our Services
          </h2>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-stone-700 max-w-sm leading-relaxed">
            A few of the things that make a stop here worth it.
          </p>
        </div>

        <ul className="lg:col-span-8 border-b border-caffeine-dark/20">
          {list.map((item) => (
            <li
              key={item.id}
              className="group grid grid-cols-[2.5rem_1fr] sm:grid-cols-[3rem_minmax(0,15rem)_1fr] gap-x-4 sm:gap-x-8 gap-y-1.5 items-start border-t border-caffeine-dark/20 py-6 sm:py-8 transition-[padding] duration-300 ease-out hover:pl-2 sm:hover:pl-4"
            >
              <ServiceIcon
                icon={item.icon}
                className="w-8 h-8 sm:w-9 sm:h-9 text-caffeine-dark transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110"
              />
              <h3 className="font-cozy text-xl sm:text-2xl font-bold leading-snug">{item.title}</h3>
              {item.description && (
                <p className="col-start-2 sm:col-start-3 text-sm sm:text-base text-stone-700 leading-relaxed">
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
