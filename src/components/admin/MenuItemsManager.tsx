"use client";

import { useState, useTransition } from "react";
import type { MenuItem, MenuCategory } from "@/types/database";
import { createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/actions/menu";
import ImageUploadField from "@/components/admin/ImageUploadField";
import SaveButton from "@/components/admin/SaveButton";

function MenuItemForm({
  item,
  onDone,
}: {
  item?: MenuItem;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = item ? await updateMenuItem(item.id, formData) : await createMenuItem(formData);
      if (result.error) {
        setError(result.error);
      } else {
        onDone();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 bg-stone-50 rounded-2xl p-5 border border-stone-200">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Name</label>
          <input
            name="name"
            required
            defaultValue={item?.name}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Category</label>
          <select
            name="category"
            defaultValue={item?.category || "drinks"}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          >
            <option value="drinks">Drinks</option>
            <option value="pastries">Pastries</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Description</label>
        <textarea
          name="description"
          defaultValue={item?.description || ""}
          rows={2}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Price ($)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={item?.price}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Badge (optional)</label>
          <input
            name="badge"
            defaultValue={item?.badge || ""}
            placeholder="Vegan, House Special…"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Sort order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={item?.sort_order ?? 0}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          />
        </div>
      </div>

      <ImageUploadField name="image_url" label="Photo" defaultValue={item?.image_url} />

      <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <input type="checkbox" name="is_available" defaultChecked={item?.is_available ?? true} className="rounded" />
        Available / shown on site
      </label>

      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

      <div className="flex items-center gap-3">
        <SaveButton pending={isPending} label={item ? "Save item" : "Add item"} />
        <button type="button" onClick={onDone} className="text-sm font-semibold text-stone-500 hover:text-stone-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function MenuItemsManager({ items }: { items: MenuItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [category, setCategory] = useState<MenuCategory | "all">("all");
  const [isPending, startTransition] = useTransition();

  const filtered = category === "all" ? items : items.filter((i) => i.category === category);

  function handleDelete(id: string) {
    if (!confirm("Delete this menu item? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteMenuItem(id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(["all", "drinks", "pastries"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                category === c ? "bg-caffeine-dark text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="bg-caffeine-dark hover:bg-caffeine-card text-white font-bold px-5 py-2.5 rounded-2xl text-sm transition-colors"
        >
          {showNew ? "Close" : "+ Add menu item"}
        </button>
      </div>

      {showNew && <MenuItemForm onDone={() => setShowNew(false)} />}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) =>
          editingId === item.id ? (
            <div key={item.id} className="sm:col-span-2 lg:col-span-3">
              <MenuItemForm item={item} onDone={() => setEditingId(null)} />
            </div>
          ) : (
            <div key={item.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden shrink-0">
                  {item.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-caffeine-dark truncate">{item.name}</p>
                  <p className="text-xs text-stone-400 capitalize">{item.category}</p>
                  <p className="text-sm font-semibold text-caffeine-accent mt-1">${Number(item.price).toFixed(2)}</p>
                </div>
                {!item.is_available && (
                  <span className="text-[10px] font-bold uppercase bg-stone-200 text-stone-500 px-2 py-1 rounded-full shrink-0">
                    Hidden
                  </span>
                )}
              </div>
              <div className="flex gap-2 pt-1 border-t border-stone-100">
                <button
                  onClick={() => setEditingId(item.id)}
                  className="flex-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 py-2 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                  className="flex-1 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {filtered.length === 0 && <p className="text-sm text-stone-400">No items in this category yet.</p>}
    </div>
  );
}
