import type { ReactNode } from "react";

/* One header for every admin page: what this page is, in plain words, what
   you can do here, and (optionally) the main action on the right. */
export default function PageHeader({
  title,
  description,
  actions,
  tips,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Short "good to know" lines shown under the description. */
  tips?: string[];
}) {
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-cozy text-2xl font-bold text-caffeine-dark sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-stone-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tips && tips.length > 0 && (
        <ul className="mt-4 max-w-2xl space-y-1 rounded-lg border border-stone-200 bg-white px-4 py-3 text-xs text-stone-500">
          {tips.map((t) => (
            <li key={t} className="flex gap-2">
              <span aria-hidden="true" className="mt-0.5 text-caffeine-accent">•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
