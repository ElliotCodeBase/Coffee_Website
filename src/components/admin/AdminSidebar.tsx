"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import type { UserRole } from "@/types/database";
import { ADMIN_ICONS } from "@/components/admin/icons";

// Pages every logged-in user sees
const BASE_NAV = [
  { href: "/admin/menu", label: "Menu Items", icon: ADMIN_ICONS.menu },
  { href: "/admin/messages", label: "Messages", icon: ADMIN_ICONS.messages },
  { href: "/admin/analytics", label: "Analytics", icon: ADMIN_ICONS.analytics },
];

// Additional pages only admin (and developer) can see
const ADMIN_ONLY_NAV = [
  { href: "/admin", label: "Overview", icon: ADMIN_ICONS.overview },
  { href: "/admin/site-info", label: "Site Info", icon: ADMIN_ICONS.siteInfo },
  { href: "/admin/staff", label: "Team", icon: ADMIN_ICONS.team },
];

const DEV_NAV = [
  { href: "/admin/developer/theme", label: "Theme & Design", icon: ADMIN_ICONS.theme },
  { href: "/admin/developer/code", label: "Custom Code", icon: ADMIN_ICONS.code },
  { href: "/admin/developer/users", label: "Users & Roles", icon: ADMIN_ICONS.users },
];

export default function AdminSidebar({ role }: { role: UserRole | undefined }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isStaff = role === "staff";
  const isAdmin = role === "admin";
  const isDev = role === "developer";

  const roleLabel =
    isDev ? "Developer access" : isStaff ? "Staff access" : "Site editor";

  function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
    // Overview is exact-match only; all others use startsWith
    const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
          active
            ? "bg-caffeine-dark border border-caffeine-dark text-white"
            : "border border-transparent text-stone-600 hover:bg-stone-100"
        }`}
      >
        <svg
          className="w-4 h-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
        <span>{label}</span>
      </Link>
    );
  }

  const sidebarContent = (
    <>
      <div className="mb-8 px-2">
        <p className="font-cozy font-bold text-lg text-caffeine-dark">Caffeine Admin</p>
        <p className="text-xs text-stone-400 mt-0.5">{roleLabel}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {/* Staff: only their allowed pages */}
        {isStaff && (
          <>
            <p className="px-4 text-[11px] uppercase font-bold tracking-wider text-stone-400 mb-2">
              Your Access
            </p>
            {BASE_NAV.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </>
        )}

        {/* Admin: full content + team nav */}
        {isAdmin && (
          <>
            <p className="px-4 text-[11px] uppercase font-bold tracking-wider text-stone-400 mb-2">
              Content
            </p>
            {ADMIN_ONLY_NAV.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
            <div className="pt-2">
              {BASE_NAV.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </>
        )}

        {/* Developer: their own dev pages */}
        {isDev && (
          <>
            <p className="px-4 text-[11px] uppercase font-bold tracking-wider text-stone-400 mb-2">
              Content
            </p>
            {/* Developers can reach overview + site-info too */}
            {[...ADMIN_ONLY_NAV, ...BASE_NAV].map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
            <p className="px-4 text-[11px] uppercase font-bold tracking-wider text-stone-400 mb-2 mt-6">
              Developer
            </p>
            {DEV_NAV.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      <div className="pt-4 border-t border-stone-200 space-y-1">
        <Link
          href="/admin/account"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>My Account</span>
        </Link>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>View live site</span>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log out</span>
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-stone-200 px-4 h-14">
        <div>
          <p className="font-cozy font-bold text-base text-caffeine-dark leading-tight">Caffeine Admin</p>
          <p className="text-[11px] text-stone-400 leading-tight">{roleLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle admin menu"
          aria-expanded={mobileOpen}
          className="p-2 text-stone-600 hover:text-caffeine-dark"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-72 sm:w-64 shrink-0 bg-white border-r border-stone-200 flex flex-col p-5 fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out md:static md:z-auto md:h-screen md:sticky md:top-0 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
