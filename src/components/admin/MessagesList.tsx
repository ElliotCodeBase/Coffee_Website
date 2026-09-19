"use client";

import { useTransition, useState } from "react";
import type { ContactSubmission } from "@/types/database";
import { markSubmissionStatus, deleteSubmission } from "@/lib/actions/messages";
import AdminButton from "@/components/admin/AdminButton";

const STATUS_STYLES: Record<ContactSubmission["status"], string> = {
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
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  const msPerYear = 365 * 24 * 60 * 60 * 1000;
  const overOneYearOld = now.getTime() - date.getTime() > msPerYear;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: overOneYearOld ? "numeric" : undefined,
  });
}

type FilterStatus = "all" | "new" | "read" | "archived";

export default function MessagesList({
  submissions,
  canManage,
}: {
  submissions: ContactSubmission[];
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterStatus>("all");

  function setStatus(id: string, status: ContactSubmission["status"]) {
    startTransition(async () => {
      await markSubmissionStatus(id, status);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Permanently delete this message? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteSubmission(id);
    });
  }

  const filtered = filter === "all" ? submissions : submissions.filter((m) => m.status === filter);
  const counts = {
    all: submissions.length,
    new: submissions.filter((m) => m.status === "new").length,
    read: submissions.filter((m) => m.status === "read").length,
    archived: submissions.filter((m) => m.status === "archived").length,
  };

  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-12 text-center">
        <svg className="w-10 h-10 text-stone-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p className="text-sm text-stone-400 font-medium">No messages yet</p>
        <p className="text-xs text-stone-300 mt-1">Contact form submissions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 border border-stone-200 rounded-lg p-1 bg-white w-fit">
        {(["all", "new", "read", "archived"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? "bg-caffeine-dark text-white"
                : "text-stone-500 hover:bg-stone-100"
            }`}
          >
            {f}
            {counts[f] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filter === f ? "bg-white/20 text-white" : "bg-stone-200 text-stone-500"
              }`}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-stone-400 py-6 text-center">No {filter} messages.</p>
      )}

      <div className="space-y-3">
        {filtered.map((msg) => (
          <div
            key={msg.id}
            className={`bg-white rounded-xl border p-5 transition-colors ${
              msg.status === "new" ? "border-blue-200 shadow-sm shadow-blue-50" : "border-stone-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-bold text-sm text-caffeine-dark">{msg.name}</p>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${STATUS_STYLES[msg.status]}`}
                  >
                    {msg.status}
                  </span>
                  {msg.topic && (
                    <span className="text-[10px] font-semibold uppercase bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md">
                      {TOPIC_LABELS[msg.topic] ?? msg.topic}
                    </span>
                  )}
                  {(msg.email_status === "failed" || msg.email_status === "skipped") && (
                    <span
                      title={msg.email_error ?? undefined}
                      className="text-[10px] font-semibold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md"
                    >
                      Email not sent
                    </span>
                  )}
                </div>
                <a href={`mailto:${msg.email}`} className="text-xs text-caffeine-accent hover:underline">
                  {msg.email}
                </a>
              </div>
              <p className="text-xs text-stone-400 shrink-0">{formatMessageDate(msg.created_at)}</p>
            </div>

            <p className="text-sm text-stone-700 mt-3 whitespace-pre-wrap leading-relaxed">{msg.message}</p>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-100 flex-wrap">
              {/* Status actions available to all who can view messages */}
              {msg.status !== "read" && (
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => setStatus(msg.id, "read")}
                  disabled={isPending}
                >
                  Mark as read
                </AdminButton>
              )}
              {msg.status !== "archived" && (
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => setStatus(msg.id, "archived")}
                  disabled={isPending}
                >
                  Archive
                </AdminButton>
              )}
              {msg.status === "archived" && (
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => setStatus(msg.id, "new")}
                  disabled={isPending}
                >
                  Restore
                </AdminButton>
              )}
              {/* Delete is admin/developer only */}
              {canManage && (
                <AdminButton
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(msg.id)}
                  disabled={isPending}
                  className="ml-auto"
                >
                  Delete
                </AdminButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
