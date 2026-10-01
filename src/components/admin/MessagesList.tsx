"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import type { ContactSubmission } from "@/types/database";
import {
  bulkDeleteSubmissions,
  bulkSetSubmissionStatus,
  deleteAllSubmissions,
} from "@/lib/actions/messages";
import AdminButton from "@/components/admin/AdminButton";

type Status = ContactSubmission["status"];
type FilterStatus = "all" | Status;

const STATUS_STYLES: Record<Status, string> = {
  new: "bg-blue-100 text-blue-700",
  read: "bg-stone-100 text-stone-600",
  archived: "bg-amber-50 text-amber-600",
};

const TOPIC_LABELS: Record<string, string> = {
  general: "General",
  catering: "Catering",
  beans: "Beans",
  feedback: "Feedback",
};

function formatMessageDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  if (isToday) return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const overOneYearOld = now.getTime() - date.getTime() > 365 * 24 * 60 * 60 * 1000;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: overOneYearOld ? "numeric" : undefined });
}

/* What the screen shows right away, before the database has answered. */
type Change =
  | { type: "status"; ids: string[]; status: Status }
  | { type: "delete"; ids: string[] }
  | { type: "deleteAll" };

function applyChange(list: ContactSubmission[], change: Change): ContactSubmission[] {
  if (change.type === "deleteAll") return [];
  const ids = new Set(change.ids);
  if (change.type === "delete") return list.filter((m) => !ids.has(m.id));
  return list.map((m) => (ids.has(m.id) ? { ...m, status: change.status } : m));
}

export default function MessagesList({
  submissions,
  canManage,
}: {
  submissions: ContactSubmission[];
  canManage: boolean;
}) {
  /* Instant feedback: every action updates this list immediately and the
     server call runs in the background. If the server refuses, React drops
     the optimistic change when the transition ends, so the message simply
     reappears, and the error is shown below. */
  const [list, apply] = useOptimistic(submissions, applyChange);
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const filtered = useMemo(() => (filter === "all" ? list : list.filter((m) => m.status === filter)), [list, filter]);
  const counts = {
    all: list.length,
    new: list.filter((m) => m.status === "new").length,
    read: list.filter((m) => m.status === "read").length,
    archived: list.filter((m) => m.status === "archived").length,
  };

  // Only ever act on messages that are still on screen.
  const liveIds = new Set(list.map((m) => m.id));
  const chosen = [...selected].filter((id) => liveIds.has(id));
  const visibleIds = filtered.map((m) => m.id);
  const allVisibleChosen = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  function run(change: Change, task: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      apply(change);
      const result = await task();
      if (result?.error) setError(result.error);
    });
  }

  function setStatus(ids: string[], status: Status) {
    if (ids.length === 0) return;
    run({ type: "status", ids, status }, () => bulkSetSubmissionStatus(ids, status));
    setSelected(new Set());
  }

  function remove(ids: string[]) {
    if (ids.length === 0) return;
    const what = ids.length === 1 ? "this message" : `these ${ids.length} messages`;
    if (!confirm(`Permanently delete ${what}? This cannot be undone.`)) return;
    run({ type: "delete", ids }, () => bulkDeleteSubmissions(ids));
    setSelected(new Set());
  }

  function removeAll() {
    setConfirmAll(false);
    run({ type: "deleteAll" }, () => deleteAllSubmissions());
    setSelected(new Set());
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleChosen) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }

  if (list.length === 0) {
    return (
      <div className="space-y-4">
        {error && <ErrorNote text={error} onClose={() => setError(null)} />}
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
          <svg className="mx-auto mb-3 h-10 w-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium text-stone-400">No messages yet</p>
          <p className="mt-1 text-xs text-stone-300">Contact form submissions will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <ErrorNote text={error} onClose={() => setError(null)} />}

      {/* Filter tabs + delete everything */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-stone-200 bg-white p-1">
          {(["all", "new", "read", "archived"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setSelected(new Set());
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === f ? "bg-caffeine-dark text-white" : "text-stone-500 hover:bg-stone-100"
              }`}
            >
              {f}
              {counts[f] > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === f ? "bg-white/20 text-white" : "bg-stone-200 text-stone-500"}`}>
                  {counts[f]}
                </span>
              )}
            </button>
          ))}
        </div>
        {canManage && (
          <AdminButton variant="danger" size="sm" onClick={() => setConfirmAll(true)}>
            Delete all messages
          </AdminButton>
        )}
      </div>

      {/* Select bar */}
      {filtered.length > 0 && (
        <div
          className={`sticky top-14 z-20 flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 md:top-0 ${
            chosen.length > 0 ? "border-caffeine-dark/30 bg-white shadow-sm" : "border-stone-200 bg-white"
          }`}
        >
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-caffeine-dark">
            <input
              type="checkbox"
              checked={allVisibleChosen}
              onChange={toggleAllVisible}
              className="h-4 w-4 accent-caffeine-dark"
              aria-label="Select all messages shown"
            />
            {chosen.length > 0 ? `${chosen.length} selected` : "Select all"}
          </label>

          {chosen.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <AdminButton variant="outline" size="sm" onClick={() => setStatus(chosen, "read")}>
                Mark as read
              </AdminButton>
              <AdminButton variant="outline" size="sm" onClick={() => setStatus(chosen, "archived")}>
                Archive
              </AdminButton>
              <AdminButton variant="outline" size="sm" onClick={() => setStatus(chosen, "new")}>
                Mark as new
              </AdminButton>
              {canManage && (
                <AdminButton variant="danger" size="sm" onClick={() => remove(chosen)}>
                  Delete
                </AdminButton>
              )}
              <button type="button" onClick={() => setSelected(new Set())} className="px-2 text-xs font-semibold text-stone-500 hover:text-caffeine-dark">
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 && <p className="py-6 text-center text-sm text-stone-400">No {filter} messages.</p>}

      <div className="space-y-3">
        {filtered.map((msg) => {
          const isChosen = selected.has(msg.id);
          return (
            <div
              key={msg.id}
              className={`rounded-xl border bg-white p-4 transition-colors sm:p-5 ${
                isChosen ? "border-caffeine-dark/50 bg-stone-50" : msg.status === "new" ? "border-blue-200 shadow-sm shadow-blue-50" : "border-stone-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isChosen}
                  onChange={() => toggle(msg.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-caffeine-dark"
                  aria-label={`Select message from ${msg.name}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-caffeine-dark">{msg.name}</p>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[msg.status]}`}>{msg.status}</span>
                        {msg.topic && (
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-stone-500">
                            {TOPIC_LABELS[msg.topic] ?? msg.topic}
                          </span>
                        )}
                        {(msg.email_status === "failed" || msg.email_status === "skipped") && (
                          <span title={msg.email_error ?? undefined} className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
                            Email not sent
                          </span>
                        )}
                      </div>
                      <a href={`mailto:${msg.email}`} className="break-all text-xs text-caffeine-accent hover:underline">
                        {msg.email}
                      </a>
                    </div>
                    <p className="shrink-0 text-xs text-stone-400">{formatMessageDate(msg.created_at)}</p>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{msg.message}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                    {msg.status !== "read" && (
                      <AdminButton variant="outline" size="sm" onClick={() => setStatus([msg.id], "read")}>
                        Mark as read
                      </AdminButton>
                    )}
                    {msg.status !== "archived" && (
                      <AdminButton variant="outline" size="sm" onClick={() => setStatus([msg.id], "archived")}>
                        Archive
                      </AdminButton>
                    )}
                    {msg.status === "archived" && (
                      <AdminButton variant="outline" size="sm" onClick={() => setStatus([msg.id], "new")}>
                        Restore
                      </AdminButton>
                    )}
                    {canManage && (
                      <AdminButton variant="danger" size="sm" onClick={() => remove([msg.id])} className="ml-auto">
                        Delete
                      </AdminButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {confirmAll && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true" aria-labelledby="del-all-title">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="del-all-title" className="font-cozy text-xl font-bold text-caffeine-dark">
              Delete all {counts.all} messages?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              This permanently removes every message — new, read and archived. It cannot be undone. If you only want to tidy up, use
              Archive instead.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <AdminButton variant="outline" onClick={() => setConfirmAll(false)}>
                Keep messages
              </AdminButton>
              <AdminButton variant="danger" onClick={removeAll}>
                Yes, delete everything
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorNote({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      <span>{text} The message was put back.</span>
      <button type="button" onClick={onClose} className="shrink-0 font-bold underline underline-offset-2">
        Dismiss
      </button>
    </div>
  );
}
