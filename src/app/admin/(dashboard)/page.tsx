import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/auth";
import { ADMIN_ICONS } from "@/components/admin/icons";
import type { ContactSubmission } from "@/types/database";

/* Overview — built from the same pieces as the other admin sections:
   a white rounded-xl card with a stone border, Cozy headings, the sidebar's
   outline icons, and the same status chips as the Messages page. */

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

function Icon({ d, className = "w-5 h-5" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StatCard({
  href,
  icon,
  label,
  value,
  hint,
  highlight = false,
}: {
  href: string;
  icon: string;
  label: string;
  value: number;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-start gap-4 rounded-xl border bg-white p-5 transition-colors hover:border-caffeine-dark/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-caffeine-dark ${
        highlight ? "border-blue-200" : "border-stone-200"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
          highlight ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-caffeine-accent"
        }`}
      >
        <Icon d={icon} />
      </span>
      <span className="min-w-0">
        <span className="block font-cozy text-3xl font-bold leading-none text-caffeine-dark tabular-nums">
          {value.toLocaleString()}
        </span>
        <span className="mt-1.5 block text-sm font-semibold text-stone-700">{label}</span>
        <span className="block text-xs text-stone-400">{hint}</span>
      </span>
    </Link>
  );
}

function ShortcutRow({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-md border border-transparent p-2.5 transition-colors hover:border-stone-200 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-caffeine-dark"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-stone-100 text-caffeine-accent">
        <Icon d={icon} className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-caffeine-dark">{title}</span>
        <span className="block truncate text-xs text-stone-500">{description}</span>
      </span>
      <Icon d={ADMIN_ICONS.chevronRight} className="w-4 h-4 shrink-0 text-stone-300 transition-colors group-hover:text-stone-500" />
    </Link>
  );
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const isAdmin = user?.profile?.role === "admin";
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const head = { count: "exact" as const, head: true };

  const [menuTotal, menuHidden, msgNew, msgTotal, msgFailed, recent, visitsTotal, visitsWeek] = await Promise.all([
    supabase.from("menu_items").select("*", head),
    supabase.from("menu_items").select("*", head).eq("is_available", false),
    supabase.from("contact_submissions").select("*", head).eq("status", "new"),
    supabase.from("contact_submissions").select("*", head),
    /* Errors (e.g. the email_status column doesn't exist yet) just mean "0". */
    supabase.from("contact_submissions").select("*", head).eq("email_status", "failed"),
    supabase
      .from("contact_submissions")
      .select("id, name, topic, message, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    /* Staff/developer can't read site_visits, so skip the queries. */
    isAdmin ? supabase.from("site_visits").select("*", head) : Promise.resolve({ count: null }),
    isAdmin ? supabase.from("site_visits").select("*", head).gte("created_at", weekAgo) : Promise.resolve({ count: null }),
  ]);

  const newCount = msgNew.count ?? 0;
  const failedCount = msgFailed.count ?? 0;
  const recentMessages = (recent.data ?? []) as Pick<ContactSubmission, "id" | "name" | "topic" | "message" | "status" | "created_at">[];
  const firstName = user?.profile?.full_name?.trim().split(/\s+/)[0];

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Welcome{firstName ? `, ${firstName}` : ""}</h1>
        <p className="text-sm text-stone-500 mt-1">A quick look at your menu, messages and visitors.</p>
      </div>

      {failedCount > 0 && (
        <Link
          href="/admin/messages"
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:border-amber-300"
        >
          <Icon d={ADMIN_ICONS.alert} className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <span className="text-sm text-amber-900">
            <span className="font-bold">
              {failedCount} {failedCount === 1 ? "message" : "messages"} couldn&apos;t be emailed to you.
            </span>{" "}
            They&apos;re safe in Messages. Check the email settings, then reply from there.
          </span>
        </Link>
      )}

      <div className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-3" : ""}`}>
        <StatCard
          href="/admin/menu"
          icon={ADMIN_ICONS.menu}
          label="Menu items"
          value={menuTotal.count ?? 0}
          hint={(menuHidden.count ?? 0) > 0 ? `${menuHidden.count} hidden from the site` : "All shown on the site"}
        />
        <StatCard
          href="/admin/messages"
          icon={ADMIN_ICONS.messages}
          label="New messages"
          value={newCount}
          hint={`${(msgTotal.count ?? 0).toLocaleString()} received in total`}
          highlight={newCount > 0}
        />
        {isAdmin && (
          <StatCard
            href="/admin/analytics"
            icon={ADMIN_ICONS.analytics}
            label="Visits this week"
            value={visitsWeek.count ?? 0}
            hint={`${(visitsTotal.count ?? 0).toLocaleString()} all time`}
          />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="min-w-0 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-cozy font-bold text-lg text-caffeine-dark">Recent messages</h2>
              <p className="text-sm text-stone-500 mt-0.5">The latest from your contact form.</p>
            </div>
            <Link href="/admin/messages" className="shrink-0 text-sm font-semibold text-caffeine-accent hover:underline">
              View all
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-stone-300 px-4 text-center text-sm text-stone-400">
              No messages yet. New contact form messages will show up here.
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {recentMessages.map((m) => (
                <li key={m.id}>
                  <Link
                    href="/admin/messages"
                    className="-mx-2 flex items-start justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-stone-50"
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-caffeine-dark">{m.name}</span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[m.status]}`}>
                          {m.status}
                        </span>
                        {m.topic && (
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-stone-500">
                            {TOPIC_LABELS[m.topic] ?? m.topic}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-1 text-sm text-stone-500">{m.message}</span>
                    </span>
                    <span className="shrink-0 text-xs text-stone-400">{formatDate(m.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="font-cozy font-bold text-lg text-caffeine-dark">Shortcuts</h2>
          <p className="text-sm text-stone-500 mt-0.5 mb-3">Jump to what you edit most.</p>
          <div className="-mx-1 space-y-0.5">
            <ShortcutRow href="/admin/site-info" icon={ADMIN_ICONS.siteInfo} title="Site info" description="Logo, hero, hours, contact" />
            <ShortcutRow href="/admin/menu" icon={ADMIN_ICONS.menu} title="Menu items" description="Add, edit or hide drinks and pastries" />
            <ShortcutRow href="/admin/messages" icon={ADMIN_ICONS.messages} title="Messages" description="Read and reply to messages" />
            <ShortcutRow href="/admin/staff" icon={ADMIN_ICONS.team} title="Team" description="Invite admins and staff" />
            {isAdmin && (
              <ShortcutRow href="/admin/analytics" icon={ADMIN_ICONS.analytics} title="Analytics" description="See how many people visit" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
