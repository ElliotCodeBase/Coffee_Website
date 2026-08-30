import type { MenuItem } from "@/types/database";

const DEFAULT_DRINK_IMG =
  "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=500&q=75";
const DEFAULT_FOOD_IMG =
  "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=75";

function MenuGrid({ items, fallbackImg }: { items: MenuItem[]; fallbackImg: string }) {
  if (items.length === 0) {
    return <p className="text-stone-500 text-sm">No items yet — check back soon.</p>;
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-caffeine-cream p-6 lg:p-7 rounded-3xl border border-stone-300/80 shadow-sm flex flex-col justify-between transition-transform duration-200 ease-out hover:-translate-y-1.5 hover:shadow-xl"
        >
          <div>
            <div className="aspect-[4/3] w-full rounded-2xl bg-stone-200 overflow-hidden mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url || fallbackImg}
                loading="lazy"
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="font-cozy font-bold text-xl lg:text-2xl text-caffeine-dark flex items-center justify-between">
              {item.name}
              {item.badge && (
                <span className="text-[11px] lg:text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-sans font-bold ml-2">
                  {item.badge}
                </span>
              )}
            </h4>
            <p className="text-xs sm:text-sm lg:text-base text-stone-600 font-normal mt-2 mb-4 leading-relaxed">
              {item.description}
            </p>
          </div>
          <div className="border-t border-stone-200 pt-4 flex justify-between items-center">
            <span className="font-cozy font-bold text-xl lg:text-2xl text-caffeine-accent">
              ${Number(item.price).toFixed(2)}
            </span>
            <span className="text-xs lg:text-sm font-medium bg-caffeine-tan text-caffeine-dark px-3 py-1 rounded-2xl">
              In-Store
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Menu({ items }: { items: MenuItem[] }) {
  const drinks = items.filter((i) => i.category === "drinks");
  const pastries = items.filter((i) => i.category === "pastries");

  return (
    <section id="menu" className="relative py-20 lg:py-32 bg-caffeine-tan px-6 sm:px-12 lg:px-20 border-b border-stone-300">
      <div className="max-w-screen-2xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block text-xs uppercase font-bold tracking-widest text-caffeine-accent bg-caffeine-cream/80 border border-stone-300 px-4 py-1.5 rounded-2xl mb-4">
            Fresh Daily
          </span>
          <h2 className="font-cozy text-3xl sm:text-5xl lg:text-6xl font-bold text-caffeine-dark mb-4">
            What we&apos;re serving
          </h2>
          <p className="text-xs sm:text-lg lg:text-xl text-stone-700 font-normal">
            Everything from classic morning espresso to fresh-baked croissants straight out of the oven.
          </p>
        </div>

        <div className="mb-20 lg:mb-28">
          <h3 className="font-cozy text-2xl sm:text-3xl lg:text-4xl font-bold text-caffeine-dark mb-8 border-b border-caffeine-dark/20 pb-3">
            Espresso & Cold Drinks
          </h3>
          <MenuGrid items={drinks} fallbackImg={DEFAULT_DRINK_IMG} />
        </div>

        <div>
          <h3 className="font-cozy text-2xl sm:text-3xl lg:text-4xl font-bold text-caffeine-dark mb-8 border-b border-caffeine-dark/20 pb-3">
            Pastries & Morning Bites
          </h3>
          <MenuGrid items={pastries} fallbackImg={DEFAULT_FOOD_IMG} />
        </div>
      </div>
    </section>
  );
}
