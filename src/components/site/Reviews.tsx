import type { Review } from "@/types/database";

const DEFAULT_AVATAR_IMG =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=75";

export default function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  // Duplicate list so the CSS marquee loops seamlessly
  let track = [...reviews];
  while (track.length < 8) track = track.concat(reviews);
  const looped = [...track, ...track];

  return (
    <section
      id="reviews"
      className="relative py-14 sm:py-20 lg:py-32 bg-caffeine-cream border-b border-stone-300 overflow-hidden flex flex-col justify-center"
    >
      <div className="max-w-screen-2xl mx-auto text-center mb-10 sm:mb-16 px-5 sm:px-6">
        <span className="inline-block text-[11px] sm:text-xs uppercase font-bold tracking-widest text-caffeine-accent bg-caffeine-tan border border-stone-300 px-3.5 sm:px-4 py-1.5 rounded-2xl mb-3 sm:mb-4">
          Community Notes
        </span>
        <h2 className="font-cozy text-2xl sm:text-5xl lg:text-6xl font-bold text-caffeine-dark">
          Kind words from neighbors
        </h2>
        <p className="text-xs sm:text-base lg:text-lg text-stone-600 font-normal mt-2 sm:mt-3">
          Hover over any card to pause the scroll.
        </p>
      </div>

      <div className="w-full overflow-hidden flex items-center py-6 sm:py-8">
        <div className="carousel-track flex gap-5 sm:gap-8 animate-infinite-scroll w-max">
          {looped.map((rev, idx) => (
            <div
              key={`${rev.id}-${idx}`}
              className="w-[260px] sm:w-[380px] lg:w-[420px] shrink-0 bg-caffeine-dark text-white p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col justify-between my-4"
            >
              <div>
                <div className="w-18 h-18 lg:w-20 lg:h-20 rounded-full overflow-hidden mx-auto -mt-12 lg:-mt-14 mb-5 border-4 border-caffeine-cream shadow-md bg-stone-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={rev.avatar_url || DEFAULT_AVATAR_IMG}
                    alt={`Photo of ${rev.author_name}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-stone-300 text-sm sm:text-base lg:text-lg leading-relaxed italic text-center mb-6 font-normal">
                  &ldquo;{rev.body}&rdquo;
                </p>
              </div>
              <div className="text-center">
                <div
                  className="flex justify-center text-caffeine-gold text-base lg:text-lg gap-1 mb-2"
                  role="img"
                  aria-label={`${rev.rating} out of 5 stars`}
                >
                  {"★".repeat(rev.rating)}
                  {"☆".repeat(5 - rev.rating)}
                </div>
                <h4 className="font-cozy font-bold text-base sm:text-lg lg:text-xl text-white">
                  {rev.author_name}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
