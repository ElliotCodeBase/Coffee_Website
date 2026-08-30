"use client";

export default function SaveButton({ pending, label = "Save changes" }: { pending: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-caffeine-dark hover:bg-caffeine-card disabled:opacity-60 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors active:scale-95"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
