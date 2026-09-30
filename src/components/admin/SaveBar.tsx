"use client";

/* Sticky "save" strip used at the bottom of admin forms. It always tells the
   person exactly where they stand: nothing changed, unsaved changes, saving,
   saved (with the time), or what went wrong — so nobody has to wonder
   whether a click "took". */

export type SaveState = {
  status: "idle" | "success" | "error";
  message?: string;
  savedAt?: Date | null;
};

export default function SaveBar({
  pending,
  dirty,
  state,
  label = "Save changes",
}: {
  pending: boolean;
  dirty: boolean;
  state: SaveState;
  label?: string;
}) {
  let tone = "text-stone-500";
  let text = "No changes yet.";
  let dot = "bg-stone-300";

  if (pending) {
    text = "Saving…";
    dot = "bg-amber-500 animate-pulse";
    tone = "text-stone-600";
  } else if (state.status === "error") {
    text = state.message || "Couldn't save. Please try again.";
    dot = "bg-red-500";
    tone = "text-red-700";
  } else if (dirty) {
    text = "You have unsaved changes.";
    dot = "bg-amber-500";
    tone = "text-amber-800";
  } else if (state.status === "success") {
    text = `Saved${state.savedAt ? ` at ${state.savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}. It's live on the site.`;
    dot = "bg-green-500";
    tone = "text-green-700";
  }

  return (
    <div className="sticky bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 md:bottom-0 -mx-4 sm:mx-0 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-none sm:rounded-xl border-t sm:border border-stone-200 bg-white/95 px-4 py-3 shadow-[0_-6px_18px_-12px_rgba(0,0,0,0.25)] backdrop-blur">
      <p className={`flex min-w-0 items-center gap-2 text-sm font-medium ${tone}`} role="status" aria-live="polite">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
        <span className="min-w-0 break-words">{text}</span>
      </p>
      <button
        type="submit"
        disabled={pending || (!dirty && state.status !== "error")}
        className="inline-flex shrink-0 items-center justify-center rounded-md border border-caffeine-dark bg-caffeine-dark px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-caffeine-card disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
      >
        {pending ? "Saving…" : label}
      </button>
    </div>
  );
}
