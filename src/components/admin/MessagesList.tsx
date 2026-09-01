"use client";

import { useTransition } from "react";
import type { ContactSubmission } from "@/types/database";
import { markSubmissionStatus } from "@/lib/actions/messages";

const STATUS_STYLES: Record<ContactSubmission["status"], string> = {
  new: "bg-blue-100 text-blue-700",
  read: "bg-stone-100 text-stone-600",
  archived: "bg-stone-100 text-stone-400",
};

/**
 * Formats a message's timestamp the way a shared inbox usually does:
 * just the time if it came in today, "day month" if it's from earlier
 * this year (or within the last year), and "day month year" once it's
 * over a year old — so an old message is still unambiguous.
 */
function formatMessageDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();

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

export default function MessagesList({
  submissions,
  canManage,
}: {
  submissions: ContactSubmission[];
  canManage: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function setStatus(id: string, status: ContactSubmission["status"]) {
    startTransition(async () => {
      await markSubmissionStatus(id, status);
    });
  }

  if (submissions.length === 0) {
    return <p className="text-sm text-stone-400">No messages yet.</p>;
  }

  return (
    <div className="space-y-3">
      {submissions.map((msg) => (
        <div key={msg.id} className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm text-caffeine-dark">{msg.name}</p>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLES[msg.status]}`}>
                  {msg.status}
                </span>
                {msg.topic && <span className="text-xs text-stone-400 capitalize">· {msg.topic}</span>}
              </div>
              <a href={`mailto:${msg.email}`} className="text-xs text-caffeine-accent hover:underline">
                {msg.email}
              </a>
            </div>
            <p className="text-xs text-stone-400">{formatMessageDate(msg.created_at)}</p>
          </div>

          <p className="text-sm text-stone-700 mt-3 whitespace-pre-wrap">{msg.message}</p>

          {canManage && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-stone-100">
              {msg.status !== "read" && (
                <button
                  onClick={() => setStatus(msg.id, "read")}
                  disabled={isPending}
                  className="text-xs font-semibold bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                >
                  Mark as read
                </button>
              )}
              {msg.status !== "archived" && (
                <button
                  onClick={() => setStatus(msg.id, "archived")}
                  disabled={isPending}
                  className="text-xs font-semibold bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                >
                  Archive
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
