/* Shown instantly while an admin page loads its data, so clicking a sidebar
   link responds immediately instead of looking frozen until the server
   answers. */
export default function AdminLoading() {
  return (
    <div className="max-w-6xl animate-pulse" role="status" aria-label="Loading">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-56 rounded-md bg-stone-200" />
        <div className="h-4 w-full max-w-md rounded bg-stone-200/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-stone-200 bg-white" />
        ))}
      </div>
      <div className="mt-6 h-64 rounded-xl border border-stone-200 bg-white" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
