"use client";

import { useState, useTransition } from "react";
import type { ContactTopic } from "@/types/database";
import { createContactTopic, updateContactTopic, deleteContactTopic, moveContactTopic } from "@/lib/actions/contact-topics";
import AdminButton from "@/components/admin/AdminButton";

/* No <form> elements anywhere in this component: it renders inside
   SiteInfoForm's page-wide <form>, and a <form> nested inside a <form> is
   invalid HTML — the browser silently hoists/breaks it, so every add/edit
   here fires its server action directly from a button click instead. */

function TopicRow({
  topic,
  isFirst,
  isLast,
  onChanged,
}: {
  topic: ContactTopic;
  isFirst: boolean;
  isLast: boolean;
  onChanged: () => void;
}) {
  const [label, setLabel] = useState(topic.label);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dirty = label.trim() !== topic.label;

  function saveLabel() {
    setError(null);
    startTransition(async () => {
      const result = await updateContactTopic(topic.id, label);
      if (result.error) setError(result.error);
      else onChanged();
    });
  }

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveContactTopic(topic.id, direction);
      if (result.error) setError(result.error);
      else onChanged();
    });
  }

  function remove() {
    if (
      !confirm(
        `Delete "${topic.label}"? Past messages that used it keep showing this label, but visitors won't be able to pick it again.`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const result = await deleteContactTopic(topic.id);
      if (result.error) setError(result.error);
      else onChanged();
    });
  }

  return (
    <div className="flex items-center gap-2 py-2 flex-wrap">
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => move("up")}
          disabled={isFirst || isPending}
          className="text-stone-400 hover:text-caffeine-dark disabled:opacity-30 disabled:hover:text-stone-400"
          aria-label="Move up"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => move("down")}
          disabled={isLast || isPending}
          className="text-stone-400 hover:text-caffeine-dark disabled:opacity-30 disabled:hover:text-stone-400"
          aria-label="Move down"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={80}
        className="flex-1 min-w-[8rem] px-3 py-2 text-sm rounded-md border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
      />
      <code className="hidden sm:inline text-[11px] text-stone-400 px-2">{topic.id}</code>
      {dirty && (
        <AdminButton type="button" size="sm" onClick={saveLabel} disabled={isPending}>
          Save
        </AdminButton>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={isPending}
        className="p-2 text-stone-400 hover:text-red-600"
        aria-label="Delete topic"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      {error && <p className="text-xs text-red-600 basis-full">{error}</p>}
    </div>
  );
}

export default function ContactTopicsManager({ initialTopics }: { initialTopics: ContactTopic[] }) {
  const [newId, setNewId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Server actions revalidate this page's cache; reloading picks up the
  // fresh list without the admin needing to also hit the big "Save
  // changes" button, which belongs to the unrelated site-settings form.
  function refresh() {
    window.location.reload();
  }

  function addTopic() {
    setError(null);
    startTransition(async () => {
      const result = await createContactTopic(newId, newLabel);
      if (result.error) {
        setError(result.error);
      } else {
        refresh();
      }
    });
  }

  return (
    <div className="rounded-lg border border-stone-200 p-5">
      <h3 className="font-cozy font-bold text-sm text-caffeine-dark">Message topics</h3>
      <p className="text-xs text-stone-400 mt-1 mb-3">
        These are the choices visitors see under &quot;What is this about?&quot; on the contact form. Reorder,
        rename, add or remove them here — no code changes needed.
      </p>

      <div className="divide-y divide-stone-100">
        {initialTopics.map((t, i) => (
          <TopicRow key={t.id} topic={t} isFirst={i === 0} isLast={i === initialTopics.length - 1} onChanged={refresh} />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">Id</label>
          <input
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="e.g. workshops"
            maxLength={40}
            className="w-32 px-3 py-2 text-sm rounded-md border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          />
        </div>
        <div className="flex-1 min-w-[10rem]">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1">
            Label shown to visitors
          </label>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Coffee Workshops"
            maxLength={80}
            className="w-full px-3 py-2 text-sm rounded-md border border-stone-300 focus:ring-2 focus:ring-caffeine-dark outline-none"
          />
        </div>
        <AdminButton type="button" size="sm" onClick={addTopic} disabled={isPending || !newId.trim() || !newLabel.trim()}>
          Add topic
        </AdminButton>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
