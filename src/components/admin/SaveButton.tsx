"use client";

export default function SaveButton({ pending, label = "Save changes" }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-caffeine-dark bg-caffeine-dark px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-caffeine-card disabled:opacity-60 disabled:hover:bg-caffeine-dark active:scale-[0.98] disabled:active:scale-100"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
