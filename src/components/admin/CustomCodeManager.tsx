"use client";

import { useState, useTransition } from "react";
import type { CustomCodeSnippet } from "@/types/database";
import { createCodeSnippet, updateCodeSnippet, deleteCodeSnippet } from "@/lib/actions/developer";
import SaveButton from "@/components/admin/SaveButton";

function SnippetForm({ snippet, onDone }: { snippet?: CustomCodeSnippet; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = snippet ? await updateCodeSnippet(snippet.id, formData) : await createCodeSnippet(formData);
      if (result.error) setError(result.error);
      else onDone();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 bg-stone-50 rounded-2xl p-5 border border-stone-200">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Label</label>
          <input
            name="label"
            defaultValue={snippet?.label || ""}
            placeholder="e.g. Google Analytics"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Injection point</label>
          <select
            name="location"
            defaultValue={snippet?.location || "head"}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          >
            <option value="head">{"<head>"}</option>
            <option value="body_start">{"Start of <body>"}</option>
            <option value="body_end">{"End of <body>"}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase text-stone-500 mb-1.5">Code</label>
        <textarea
          name="code"
          required
          rows={8}
          defaultValue={snippet?.code || ""}
          placeholder="<script>...</script>"
          className="w-full px-3 py-2.5 text-sm font-mono rounded-xl border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <input type="checkbox" name="is_active" defaultChecked={snippet?.is_active ?? false} className="rounded" />
        Active on live site
      </label>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
        ⚠️ This code runs directly on your live site with no sandboxing. Only paste code you trust (e.g. from
        Google Analytics, Meta Pixel, or your own scripts).
      </div>

      {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}

      <div className="flex items-center gap-3">
        <SaveButton pending={isPending} label={snippet ? "Save snippet" : "Add snippet"} />
        <button type="button" onClick={onDone} className="text-sm font-semibold text-stone-500 hover:text-stone-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function CustomCodeManager({ snippets }: { snippets: CustomCodeSnippet[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Delete this code snippet? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteCodeSnippet(id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowNew((v) => !v)}
          className="bg-caffeine-dark hover:bg-caffeine-card text-white font-bold px-5 py-2.5 rounded-2xl text-sm transition-colors"
        >
          {showNew ? "Close" : "+ Add snippet"}
        </button>
      </div>

      {showNew && <SnippetForm onDone={() => setShowNew(false)} />}

      <div className="space-y-3">
        {snippets.map((snippet) =>
          editingId === snippet.id ? (
            <SnippetForm key={snippet.id} snippet={snippet} onDone={() => setEditingId(null)} />
          ) : (
            <div key={snippet.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-caffeine-dark">{snippet.label || "Untitled snippet"}</p>
                  <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                    {snippet.location}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      snippet.is_active ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-400"
                    }`}
                  >
                    {snippet.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <pre className="text-xs text-stone-500 mt-2 line-clamp-2 font-mono">{snippet.code}</pre>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditingId(snippet.id)}
                  className="text-xs font-semibold bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(snippet.id)}
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

      {snippets.length === 0 && <p className="text-sm text-stone-400">No custom code snippets yet.</p>}
    </div>
  );
}
