"use client";

import { useState, useTransition } from "react";
import type { Review } from "@/types/database";
import { createReview, updateReview, deleteReview } from "@/lib/actions/reviews";
import ImageUploadField from "@/components/admin/ImageUploadField";
import SaveButton from "@/components/admin/SaveButton";

function ReviewForm({ review, onDone }: { review?: Review; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = review ? await updateReview(review.id, formData) : await createReview(formData);
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 bg-stone-50 rounded-2xl p-5 border border-stone-200">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Customer name</label>
          <input
            name="author_name"
            required
            defaultValue={review?.author_name}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Rating</label>
          <select
            name="rating"
            defaultValue={review?.rating ?? 5}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {"★".repeat(r)} ({r})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Review text</label>
        <textarea
          name="body"
          required
          rows={3}
          defaultValue={review?.body}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
        />
      </div>

      <ImageUploadField name="avatar_url" label="Customer photo (optional)" defaultValue={review?.avatar_url} />

      <div className="grid sm:grid-cols-2 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Sort order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={review?.sort_order ?? 0}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-700 pb-2.5">
          <input type="checkbox" name="is_published" defaultChecked={review?.is_published ?? true} className="rounded" />
          Published / shown on site
        </label>
      </div>

      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

      <div className="flex items-center gap-3">
        <SaveButton pending={isPending} label={review ? "Save review" : "Add review"} />
        <button type="button" onClick={onDone} className="text-sm font-semibold text-stone-500 hover:text-stone-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ReviewsManager({ reviews }: { reviews: Review[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteReview(id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowNew((v) => !v)}
          className="bg-caffeine-dark hover:bg-caffeine-card text-white font-bold px-5 py-2.5 rounded-2xl text-sm transition-colors"
        >
          {showNew ? "Close" : "+ Add review"}
        </button>
      </div>

      {showNew && <ReviewForm onDone={() => setShowNew(false)} />}

      <div className="space-y-3">
        {reviews.map((review) =>
          editingId === review.id ? (
            <ReviewForm key={review.id} review={review} onDone={() => setEditingId(null)} />
          ) : (
            <div key={review.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-stone-100 overflow-hidden shrink-0">
                {review.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={review.avatar_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-caffeine-dark">{review.author_name}</p>
                  <span className="text-amber-500 text-xs">{"★".repeat(review.rating)}</span>
                  {!review.is_published && (
                    <span className="text-[10px] font-bold uppercase bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-600 mt-1 line-clamp-2">{review.body}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditingId(review.id)}
                  className="text-xs font-semibold bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={isPending}
                  className="text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {reviews.length === 0 && <p className="text-sm text-stone-400">No reviews yet.</p>}
    </div>
  );
}
