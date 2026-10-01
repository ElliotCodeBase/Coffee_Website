"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import type { UserRole } from "@/types/database";
import { ADMIN_ICONS } from "@/components/admin/icons";

type Item = { href: string; label: string; icon: string; badgeKey?: "messages" };
type Group = { title: string; items: Item[] };

/* Grouped by what people are trying to do, in plain words, so nobody has to
   guess which page holds what. Staff see only the groups they may use. */
const HOME: Item = { href: "/admin", label: "Home", icon: ADMIN_ICONS.overview };
const MENU: Item = { href: "/admin/menu", label: "Menu items", icon: ADMIN_ICONS.menu };
const MESSAGES: Item = { href: "/admin/messages", label: "Messages", icon: ADMIN_ICONS.messages, badgeKey: "messages" };
const VISITORS: Item = { href: "/admin/analytics", label: "Visitors", icon: ADMIN_ICONS.analytics };

const STAFF_GROUPS: Group[] = [
  { title: "Every day", items: [HOME, MENU, MESSAGES] },
  { title: "Business", items: [VISITORS] },
];

const ADMIN_GROUPS: Group[] = [
  { title: "Every day", items: [HOME, MENU, MESSAGES] },
  {
    title: "Your website",
    items: [
      { href: "/admin/site-info", label: "Text, photos & hours", icon: ADMIN_ICONS.siteInfo },
      { href: "/admin/services", label: "Our Services", icon: ADMIN_ICONS.services },
      { href: "/admin/theme", label: "Look & Feel", icon: ADMIN_ICONS.theme },
      { href: "/admin/image-history", label: "Image history", icon: ADMIN_ICONS.history },
      { href: "/admin/legal", label: "Legal pages", icon: ADMIN_ICONS.legal },
    ],
  },
  { title: "Business", items: [VISITORS, { href: "/admin/staff", label: "Team", icon: ADMIN_ICONS.team }] },
];

const DEV_GROUP: Group = {
  title: "Developer",
  items: [
    { href: "/admin/developer/code", label: "Custom code", icon: ADMIN_ICONS.code },
    { href: "/admin/developer/users", label: "Users & roles", icon: ADMIN_ICONS.users },
  ],
};

function Icon({ d, className = "w-[18px] h-[18px]" }: { d: string; className?: string }) {
  return (
    <svg className={`${className} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

export default function AdminSidebar({
  role,
  businessName = "Caffeine",
  newMessages = 0,
}: {
  role: UserRole | undefined;
  businessName?: string;
  newMessages?: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  /* The link that was just pressed. It is highlighted immediately, before the
     next page has loaded, so the panel feels instant; it clears itself once
     the URL actually changes. */
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);
  const pendingHref = pending && pending.from === pathname ? pending.href : null;
  const setPendingHref = (href: string) => setPending({ href, from: pathname });

  const isStaff = role === "staff";
  const isDev = role === "developer";
  const roleLabel = isDev ? "Developer" : isStaff ? "Staff" : "Owner";

  const groups: Group[] = isStaff ? STAFF_GROUPS : isDev ? [...ADMIN_GROUPS, DEV_GROUP] : ADMIN_GROUPS;

  const isActive = (href: string) => {
    const current = pendingHref ?? pathname;
    return href === "/admin" ? current === href : current.startsWith(href);
  };
  const badgeFor = (item: Item) => (item.badgeKey === "messages" && newMessages > 0 ? newMessages : 0);

  function NavItem({ item }: { item: Item }) {
    const active = isActive(item.href);
    const badge = badgeFor(item);
    return (
      <Link
        href={item.href}
        onClick={() => {
          setMobileOpen(false);
          setPendingHref(item.href);
        }}
        aria-current={active ? "page" : undefined}
        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          active ? "bg-caffeine-dark text-white shadow-sm" : "text-stone-600 hover:bg-stone-100 hover:text-caffeine-dark"
        }`}
      >
        <Icon d={item.icon} />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {badge > 0 && (
          <span
            className={`min-w-[1.4rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold leading-none ${
              active ? "bg-white text-caffeine-dark" : "bg-blue-600 text-white"
            }`}
            aria-label={`${badge} new`}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    );
  }

  const sidebarContent = (
    <>
      <div className="mb-6 flex items-center gap-3 px-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-caffeine-dark font-cozy text-lg font-bold text-white" aria-hidden="true">
          {businessName.trim().charAt(0).toUpperCase() || "C"}
        </span>
        <div className="min-w-0">
          <p className="truncate font-cozy text-base font-bold leading-tight text-caffeine-dark">{businessName}</p>
          <p className="text-xs text-stone-400">{roleLabel} panel</p>
        </div>
      </div>

      <nav className="-mx-1 flex-1 space-y-5 overflow-y-auto px-1" aria-label="Admin">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-stone-400">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 space-y-0.5 border-t border-stone-200 pt-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-caffeine-dark transition-colors hover:bg-stone-100"
        >
          <Icon d={ADMIN_ICONS.external} />
          <span>View live website</span>
        </Link>
        <Link
          href="/admin/account"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100"
        >
          <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          <span>My account</span>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            <span>Log out</span>
          </button>
        </form>
      </div>
    </>
  );

  // Phones get a bottom bar with the three things people do most, plus "More".
  const quick: Item[] = [HOME, MENU, MESSAGES];

  return (
    <>
      {pendingHref && pendingHref !== pathname && (
        <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent" aria-hidden="true">
          <div className="admin-progress h-full w-1/3 bg-caffeine-dark" />
        </div>
      )}

      {/* Phone top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-stone-200 bg-white px-4 md:hidden">
        <p className="max-w-[65vw] truncate font-cozy text-base font-bold text-caffeine-dark">{businessName}</p>
        <Link
          href="/"
          target="_blank"
          className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700"
        >
          View site
        </Link>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-stone-200 bg-white p-4 transition-transform duration-200 ease-out sm:w-64 md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      <nav
        aria-label="Quick links"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {quick.map((item) => {
          const active = isActive(item.href);
          const badge = badgeFor(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setPendingHref(item.href)}
              className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                active ? "text-caffeine-dark" : "text-stone-500"
              }`}
            >
              <Icon d={item.icon} className="h-5 w-5" />
              {item.label.split(" ")[0]}
              {badge > 0 && (
                <span className="absolute right-[26%] top-1 rounded-full bg-blue-600 px-1.5 text-[10px] font-bold leading-4 text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-caffeine-dark" />}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-stone-500"
        >
          <Icon d="M4 6h16M4 12h16M4 18h16" className="h-5 w-5" />
          More
        </button>
      </nav>
    </>
  );
}
