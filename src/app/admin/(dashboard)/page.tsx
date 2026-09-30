import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
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

function weekAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
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
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          highlight ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-caffeine-accent"
        }`}
      >
        <Icon d={icon} />
      </span>
      <span className="min-w-0">
        <span className="block font-cozy text-3xl font-bold leading-none text-caffeine-dark tabular-nums">{value.toLocaleString()}</span>
        <span className="mt-1.5 block text-sm font-semibold text-stone-700">{label}</span>
        <span className="block text-xs text-stone-400">{hint}</span>
      </span>
    </Link>
  );
}

function ActionCard({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-caffeine-dark/40 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-caffeine-dark"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-caffeine-dark text-white">
        <Icon d={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-caffeine-dark">{title}</span>
        <span className="block text-xs leading-snug text-stone-500">{description}</span>
      </span>
      <Icon d={ADMIN_ICONS.chevronRight} className="h-4 w-4 shrink-0 text-stone-300 transition-colors group-hover:text-caffeine-dark" />
    </Link>
  );
}

type Attention = { href: string; tone: "blue" | "amber"; text: string; cta: string };

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const isAdmin = user?.profile?.role === "admin";
  const canEditSite = user?.profile?.role === "admin" || user?.profile?.role === "developer";
  const weekAgo = weekAgoIso();
  const head = { count: "exact" as const, head: true };

  const [menuTotal, menuHidden, serviceTotal, serviceHidden, msgNew, msgTotal, msgFailed, recent, visitsTotal, visitsWeek] = await Promise.all([
    supabase.from("menu_items").select("*", head),
    supabase.from("menu_items").select("*", head).eq("is_available", false),
    supabase.from("service_items").select("*", head),
    supabase.from("service_items").select("*", head).eq("is_visible", false),
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
  const hiddenMenu = menuHidden.count ?? 0;
  const recentMessages = (recent.data ?? []) as Pick<ContactSubmission, "id" | "name" | "topic" | "message" | "status" | "created_at">[];
  const firstName = user?.profile?.full_name?.trim().split(/\s+/)[0];

  const attention: Attention[] = [];
  if (newCount > 0) {
    attention.push({
      href: "/admin/messages",
      tone: "blue",
      text: `${newCount} new ${newCount === 1 ? "message is" : "messages are"} waiting for a reply.`,
      cta: "Open messages",
    });
  }
  if (failedCount > 0) {
    attention.push({
      href: "/admin/messages",
      tone: "amber",
      text: `${failedCount} ${failedCount === 1 ? "message" : "messages"} couldn't be emailed to you. They're safe in Messages.`,
      cta: "See them",
    });
  }
  if (hiddenMenu > 0) {
    attention.push({
      href: "/admin/menu",
      tone: "amber",
      text: `${hiddenMenu} menu ${hiddenMenu === 1 ? "item is" : "items are"} hidden from the website right now.`,
      cta: "Review menu",
    });
  }

  return (
    <div className="max-w-6xl">
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
        description="Here's what needs you today, and the quickest ways to update your website."
        actions={
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-caffeine-dark hover:text-caffeine-dark"
          >
            <Icon d={ADMIN_ICONS.external} className="h-4 w-4" />
            View live website
          </Link>
        }
      />

      <section aria-labelledby="attention-heading" className="mb-8">
        <h2 id="attention-heading" className="mb-3 font-cozy text-lg font-bold text-caffeine-dark">
          Needs your attention
        </h2>
        {attention.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white" aria-hidden="true">✓</span>
            You&apos;re all caught up — no new messages and nothing hidden.
          </div>
        ) : (
          <ul className="space-y-2">
            {attention.map((a) => (
              <li key={a.text}>
                <Link
                  href={a.href}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${
                    a.tone === "blue"
                      ? "border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-300"
                      : "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300"
                  }`}
                >
                  <span className="flex min-w-0 items-start gap-3 text-sm font-medium">
                    <Icon d={a.tone === "blue" ? ADMIN_ICONS.messages : ADMIN_ICONS.alert} className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{a.text}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold underline underline-offset-4">{a.cta}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="actions-heading" className="mb-8">
        <h2 id="actions-heading" className="mb-3 font-cozy text-lg font-bold text-caffeine-dark">
          What would you like to do?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard href="/admin/menu" icon={ADMIN_ICONS.plus} title="Add or edit a menu item" description="Prices, descriptions, photos, or hide something that's sold out." />
          <ActionCard href="/admin/messages" icon={ADMIN_ICONS.messages} title="Read and reply to messages" description="Questions and requests from your contact form." />
          {canEditSite && (
            <ActionCard href="/admin/site-info" icon={ADMIN_ICONS.siteInfo} title="Change hours, text or photos" description="Opening hours, your story, headline and contact details." />
          )}
          {canEditSite && (
            <ActionCard href="/admin/theme" icon={ADMIN_ICONS.theme} title="Change colors or the loading animation" description="Pick a palette and fonts, or adjust the opening animation." />
          )}
          {isAdmin && (
            <ActionCard href="/admin/staff" icon={ADMIN_ICONS.team} title="Invite someone to help" description="Give a team member staff access to menu and messages." />
          )}
          {isAdmin && (
            <ActionCard href="/admin/analytics" icon={ADMIN_ICONS.analytics} title="See how many people visit" description="Visits by day, week, month or year." />
          )}
        </div>
      </section>

      <div className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : ""}`}>
        <StatCard
          href="/admin/menu"
          icon={ADMIN_ICONS.menu}
          label="Menu items"
          value={menuTotal.count ?? 0}
          hint={hiddenMenu > 0 ? `${hiddenMenu} hidden from the site` : "All shown on the site"}
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
            href="/admin/services"
            icon={ADMIN_ICONS.services}
            label="Services"
            value={serviceTotal.count ?? 0}
            hint={(serviceHidden.count ?? 0) > 0 ? `${serviceHidden.count} hidden from the site` : "All shown on the site"}
          />
        )}
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

      <section className="mt-8 min-w-0 rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-cozy text-lg font-bold text-caffeine-dark">Recent messages</h2>
            <p className="mt-0.5 text-sm text-stone-500">The latest from your contact form.</p>
          </div>
          <Link href="/admin/messages" className="shrink-0 text-sm font-semibold text-caffeine-accent hover:underline">
            View all
          </Link>
        </div>

        {recentMessages.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-stone-300 px-4 text-center text-sm text-stone-400">
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
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[m.status]}`}>{m.status}</span>
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
    </div>
  );
}
