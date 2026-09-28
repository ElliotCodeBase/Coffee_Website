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

/* An index, not a card grid: each service is a full-width line set in the
   display face. On hover or keyboard focus a dark fill wipes across the row,
   the name and description switch to milk-white, and the icon turns. The
   description is always visible (touch screens have no hover), so the hover
   only adds delight, never information. */
export default function Services({ items }: { items: ServiceItem[] }) {
  const visible = items.filter((i) => i.is_visible);
  const list = visible.length > 0 ? visible : FALLBACK_SERVICES;

  return (
    <section
      id="services"
      className="relative scroll-mt-16 sm:scroll-mt-20 lg:scroll-mt-24 py-16 sm:py-24 lg:py-32 bg-caffeine-tan text-caffeine-dark px-5 sm:px-12 lg:px-20"
    >
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-10 sm:mb-14 lg:mb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 lg:gap-16">
          <h2 className="font-cozy text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.02] text-balance">
            Our Services
          </h2>
          <p className="max-w-sm text-base sm:text-lg text-stone-700 leading-relaxed">
            A few of the things that make a stop here worth it.
          </p>
        </div>

        <ul className="border-b-2 border-caffeine-dark">
          {list.map((item) => (
            <li
              key={item.id}
              tabIndex={0}
              className="group relative overflow-hidden border-t-2 border-caffeine-dark outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-caffeine-accent"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 bg-caffeine-dark transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />
              <div className="relative grid grid-cols-[1fr_auto] lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)_auto] items-center gap-x-6 sm:gap-x-10 gap-y-2 py-6 sm:py-8 lg:py-10 px-1 sm:px-2 transition-[padding,color] duration-500 ease-out group-hover:pl-4 sm:group-hover:pl-8 group-hover:text-white group-focus-visible:pl-4 sm:group-focus-visible:pl-8 group-focus-visible:text-white">
                <h3 className="font-cozy text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-balance">
                  {item.title}
                </h3>
                <span className="row-span-1 lg:order-last flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-current transition-transform duration-500 ease-out group-hover:-rotate-12 group-hover:scale-110 group-focus-visible:-rotate-12">
                  <ServiceIcon icon={item.icon} className="h-6 w-6 sm:h-8 sm:w-8" />
                </span>
                {item.description && (
                  <p className="col-span-2 lg:col-span-1 text-sm sm:text-base leading-relaxed text-stone-700 transition-colors duration-500 group-hover:text-stone-200 group-focus-visible:text-stone-200">
                    {item.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
