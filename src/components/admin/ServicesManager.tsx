"use client";

import { useState, useTransition } from "react";
import type { ServiceItem } from "@/types/database";
import { createServiceItem, updateServiceItem, deleteServiceItem } from "@/lib/actions/services";
import ServiceIcon, { SERVICE_ICON_OPTIONS } from "@/components/site/ServiceIcon";
import SaveButton from "@/components/admin/SaveButton";
import AdminButton from "@/components/admin/AdminButton";
import AdminModal from "@/components/admin/AdminModal";

// ── Item form (create or edit) ─────────────────────────────────────────────
function ServiceItemForm({ item, onDone }: { item?: ServiceItem; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = item ? await updateServiceItem(item.id, formData) : await createServiceItem(formData);
      if (result.error) {
        setError(result.error);
      } else {
        onDone();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          required
          placeholder="e.g. Espresso Bar"
          defaultValue={item?.title}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Description</label>
        <textarea
          name="description"
          defaultValue={item?.description || ""}
          rows={2}
          placeholder="One short sentence shown under the title…"
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none bg-white resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Icon</label>
          <select
            name="icon"
            defaultValue={item?.icon || "coffee"}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none bg-white"
          >
            {SERVICE_ICON_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Sort order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={item?.sort_order ?? 0}
            className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none bg-white"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 bg-white cursor-pointer hover:bg-stone-50 transition-colors">
        <input
          type="checkbox"
          name="is_visible"
          defaultChecked={item?.is_visible ?? true}
          className="rounded border-stone-300 text-caffeine-dark focus:ring-caffeine-dark"
        />
        <span className="text-sm font-medium text-stone-700">Visible on site</span>
      </label>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 font-semibold bg-red-50 rounded-lg px-4 py-3 border border-red-200">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center gap-3 border-t border-stone-200 bg-white/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:-mb-5 sm:px-6">
        <SaveButton pending={isPending} label={item ? "Save changes" : "Add service"} />
        <AdminButton type="button" variant="outline" onClick={onDone} disabled={isPending}>
          Cancel
        </AdminButton>
      </div>
    </form>
  );
}

// ── Item card ──────────────────────────────────────────────────────────────
function ServiceItemCard({
  item,
  onEdit,
  onDelete,
  disabled,
}: {
  item: ServiceItem;
  onEdit: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 flex flex-col gap-3 transition-shadow hover:shadow-md ${
        !item.is_visible ? "opacity-60 border-stone-200" : "border-stone-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-lg bg-caffeine-dark/5 text-caffeine-dark flex items-center justify-center shrink-0">
          <ServiceIcon icon={item.icon} className="w-5 h-5" />
        </div>
        {!item.is_visible && (
          <span className="text-[10px] font-bold uppercase bg-stone-800/80 text-white px-2 py-0.5 rounded-md">Hidden</span>
        )}
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm text-caffeine-dark leading-snug">{item.title}</p>
        {item.description && <p className="text-xs text-stone-500 leading-relaxed mt-0.5 line-clamp-2">{item.description}</p>}
      </div>
      <div className="flex gap-2">
        <AdminButton variant="outline" size="sm" className="flex-1" onClick={onEdit}>
          Edit
        </AdminButton>
        <AdminButton variant="danger" size="sm" className="flex-1" onClick={onDelete} disabled={disabled}>
          Delete
        </AdminButton>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ServicesManager({ items }: { items: ServiceItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [isPending, startTransition] = useTransition();

  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const editingItem = editingId ? items.find((i) => i.id === editingId) : undefined;
  const closeEditor = () => {
    setEditingId(null);
    setShowNew(false);
  };

  function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteServiceItem(id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <AdminButton
          variant="primary"
          onClick={() => {
            setEditingId(null);
            setShowNew(true);
          }}
        >
          + Add service
        </AdminButton>
      </div>

      {(showNew || editingItem) && (
        <AdminModal title={editingItem ? `Edit "${editingItem.title}"` : "New service"} onClose={closeEditor}>
          <ServiceItemForm key={editingItem?.id ?? "new"} item={editingItem} onDone={closeEditor} />
        </AdminModal>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
          <p className="text-sm text-stone-400 font-medium">No services yet — the site is showing four starter examples.</p>
          <button onClick={() => setShowNew(true)} className="text-xs text-caffeine-accent underline underline-offset-2 mt-2">
            Add your first one →
          </button>
        </div>
      ) : (
        <div className="grid auto-rows-fr sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map((item) => (
            <ServiceItemCard
              key={item.id}
              item={item}
              onEdit={() => {
                setShowNew(false);
                setEditingId(item.id);
              }}
              onDelete={() => handleDelete(item.id, item.title)}
              disabled={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
