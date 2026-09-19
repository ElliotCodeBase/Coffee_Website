"use client";

import { useState, useTransition } from "react";
import type { MenuItem, MenuCategory } from "@/types/database";
import { createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/actions/menu";
import ImageUploadField from "@/components/admin/ImageUploadField";
import SaveButton from "@/components/admin/SaveButton";
import AdminButton from "@/components/admin/AdminButton";

const CATEGORY_LABELS: Record<MenuCategory | "all", string> = {
  all: "All Items",
  drinks: "☕ Drinks",
  pastries: "🥐 Pastries",
};

// ── Item form (create or edit) ─────────────────────────────────────────────
function MenuItemForm({ item, onDone }: { item?: MenuItem; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = item
        ? await updateMenuItem(item.id, formData)
        : await createMenuItem(formData);
      if (result.error) {
        setError(result.error);
      } else {
        onDone();
      }
    });
  }

  return (
    <div className="bg-stone-50 rounded-xl border border-stone-200 p-5 sm:p-6">
      <h3 className="font-cozy font-bold text-base text-caffeine-dark mb-5">
        {item ? "Edit item" : "New menu item"}
      </h3>
      <form action={handleSubmit} className="space-y-5">
        {/* Row 1: Name + Category */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
              Item name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Honey Lavender Latte"
              defaultValue={item?.name}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Category</label>
            <select
              name="category"
              defaultValue={item?.category || "drinks"}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none bg-white"
            >
              <option value="drinks">☕ Drinks</option>
              <option value="pastries">🥐 Pastries</option>
            </select>
          </div>
        </div>

        {/* Row 2: Description */}
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
            Description
          </label>
          <textarea
            name="description"
            defaultValue={item?.description || ""}
            rows={2}
            placeholder="Short description shown on the menu…"
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none bg-white resize-none"
          />
        </div>

        {/* Row 3: Price + Badge + Sort */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
              Price ($) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={item?.price}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
              Badge <span className="text-stone-300 font-normal normal-case">(optional)</span>
            </label>
            <input
              name="badge"
              defaultValue={item?.badge || ""}
              placeholder="Vegan, House Special…"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none bg-white"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
              Sort order
            </label>
            <input
              name="sort_order"
              type="number"
              defaultValue={item?.sort_order ?? 0}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none bg-white"
            />
          </div>
        </div>

        {/* Image upload */}
        <ImageUploadField name="image_url" label="Photo" defaultValue={item?.image_url} />

        {/* Toggles */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { name: "is_available", label: "Available on site", default: item?.is_available ?? true, color: "green" },
            { name: "is_best_seller", label: "Best Seller badge", default: item?.is_best_seller ?? false, color: "amber" },
            { name: "is_new", label: "New badge", default: item?.is_new ?? false, color: "blue" },
          ].map((toggle) => (
            <label
              key={toggle.name}
              className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-white cursor-pointer hover:bg-stone-50 transition-colors"
            >
              <input
                type="checkbox"
                name={toggle.name}
                defaultChecked={toggle.default}
                className="rounded border-stone-300 text-caffeine-dark focus:ring-caffeine-dark"
              />
              <span className="text-sm font-medium text-stone-700">{toggle.label}</span>
            </label>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 font-semibold bg-red-50 rounded-lg px-4 py-3 border border-red-200">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <SaveButton pending={isPending} label={item ? "Save changes" : "Add item"} />
          <AdminButton type="button" variant="outline" onClick={onDone} disabled={isPending}>
            Cancel
          </AdminButton>
        </div>
      </form>
    </div>
  );
}

// ── Item card ──────────────────────────────────────────────────────────────
function MenuItemCard({
  item,
  onEdit,
  onDelete,
  disabled,
}: {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border flex flex-col gap-0 overflow-hidden transition-shadow hover:shadow-md ${
      !item.is_available ? "opacity-60 border-stone-200" : "border-stone-200"
    }`}>
      {/* Image.
          Every thumbnail is locked to the same 4:3 box regardless of the
          source image's own dimensions. The previous version sized the
          <img> with `w-full h-full` inside a parent whose height came only
          from `aspect-ratio` — a percentage height against a parent with no
          definite height isn't resolvable in every engine, so the image fell
          back to its intrinsic height and tall/wide uploads produced cards
          of visibly different heights. Absolutely positioning the image
          inside the (already `relative`) ratio box makes the crop
          deterministic everywhere, and `shrink-0` stops the flex column from
          squeezing it when a sibling grows. */}
      <div className="relative w-full aspect-[4/3] shrink-0 overflow-hidden bg-stone-100">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Status / badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {!item.is_available && (
            <span className="text-[10px] font-bold uppercase bg-stone-800/80 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
              Hidden
            </span>
          )}
          {item.is_best_seller && (
            <span className="text-[10px] font-bold uppercase bg-amber-500/90 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
              Best Seller
            </span>
          )}
          {item.is_new && (
            <span className="text-[10px] font-bold uppercase bg-green-500/90 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
              New
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-sm text-caffeine-dark leading-snug truncate">{item.name}</p>
            <p className="text-xs text-stone-400 capitalize mt-0.5">{item.category}</p>
          </div>
          <p className="text-sm font-bold text-caffeine-accent shrink-0">
            ${Number(item.price).toFixed(2)}
          </p>
        </div>
        {item.description && (
          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mt-0.5">{item.description}</p>
        )}
        {item.badge && (
          <span className="self-start text-[10px] font-semibold uppercase bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md mt-0.5">
            {item.badge}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4 pt-1">
        <AdminButton variant="outline" size="sm" className="flex-1" onClick={onEdit}>
          Edit
        </AdminButton>
        <AdminButton
          variant="danger"
          size="sm"
          className="flex-1"
          onClick={onDelete}
          disabled={disabled}
        >
          Delete
        </AdminButton>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function MenuItemsManager({ items }: { items: MenuItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [category, setCategory] = useState<MenuCategory | "all">("all");
  const [isPending, startTransition] = useTransition();

  const filtered =
    category === "all" ? items : items.filter((i) => i.category === category);

  const counts = {
    all: items.length,
    drinks: items.filter((i) => i.category === "drinks").length,
    pastries: items.filter((i) => i.category === "pastries").length,
  };

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteMenuItem(id);
    });
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Category tabs */}
        <div className="flex gap-1 border border-stone-200 rounded-lg p-1 bg-white">
          {(["all", "drinks", "pastries"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                category === c
                  ? "bg-caffeine-dark text-white"
                  : "text-stone-500 hover:bg-stone-100"
              }`}
            >
              {CATEGORY_LABELS[c]}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  category === c
                    ? "bg-white/20 text-white"
                    : "bg-stone-200 text-stone-500"
                }`}
              >
                {counts[c === "all" ? "all" : c]}
              </span>
            </button>
          ))}
        </div>

        <AdminButton
          variant="primary"
          onClick={() => {
            setShowNew((v) => !v);
            setEditingId(null);
          }}
        >
          {showNew ? "✕ Cancel" : "+ Add item"}
        </AdminButton>
      </div>

      {/* New item form */}
      {showNew && (
        <MenuItemForm onDone={() => setShowNew(false)} />
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
          <p className="text-sm text-stone-400 font-medium">No items in this category yet.</p>
          <button
            onClick={() => setShowNew(true)}
            className="text-xs text-caffeine-accent underline underline-offset-2 mt-2"
          >
            Add the first one →
          </button>
        </div>
      ) : (
        <div className="grid auto-rows-fr sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) =>
            editingId === item.id ? (
              <div key={item.id} className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
                <MenuItemForm item={item} onDone={() => setEditingId(null)} />
              </div>
            ) : (
              <MenuItemCard
                key={item.id}
                item={item}
                onEdit={() => {
                  setEditingId(item.id);
                  setShowNew(false);
                }}
                onDelete={() => handleDelete(item.id, item.name)}
                disabled={isPending}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
