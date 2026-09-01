"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import type { UserRole } from "@/types/database";

const CLIENT_NAV = [
  { href: "/admin", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/admin/site-info", label: "Site Info", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { href: "/admin/menu", label: "Menu Items", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  { href: "/admin/reviews", label: "Reviews", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
  { href: "/admin/messages", label: "Messages", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
];

// Admin (the client) can add/remove staff accounts. Staff themselves
// never see this — it's filtered out below for role === "staff".
const ADMIN_NAV = [
  { href: "/admin/staff", label: "Staff", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-8.13a4 4 0 11-4 4 4 4 0 014-4zm6 8a4 4 0 10-4-4" },
];

const DEV_NAV = [
  { href: "/admin/developer/theme", label: "Theme & Design", icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M8 12l4 4" },
  { href: "/admin/developer/code", label: "Custom Code", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
  { href: "/admin/developer/users", label: "Users & Roles", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-8.13a4 4 0 11-4 4 4 4 0 014-4zm6 8a4 4 0 10-4-4" },
];

export default function AdminSidebar({ role }: { role: UserRole | undefined }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Staff accounts only ever see the Menu Items page — everything else
  // on the site is admin/developer-only (also enforced server-side by
  // middleware + RLS, this is just so they don't see links they can't use).
  const clientNav = role === "staff" ? CLIENT_NAV.filter((item) => item.href === "/admin/menu") : CLIENT_NAV;
  const roleLabel = role === "developer" ? "Developer access" : role === "staff" ? "Staff access" : "Site editor";

  function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          active ? "bg-caffeine-dark text-white" : "text-stone-600 hover:bg-stone-100"
        }`}
      >
        <svg className="w-4.5 h-4.5 shrink-0" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
        <p className="px-4 text-[11px] uppercase font-bold tracking-wider text-stone-400 mb-2 mt-2">Content</p>
        {clientNav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        {role === "admin" && (
          <>
            <p className="px-4 text-[11px] uppercase font-bold tracking-wider text-stone-400 mb-2 mt-6">Team</p>
            {ADMIN_NAV.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </>
        )}

        {role === "developer" && (
          <>
            <p className="px-4 text-[11px] uppercase font-bold tracking-wider text-stone-400 mb-2 mt-6">Developer</p>
            {DEV_NAV.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      <div className="pt-4 border-t border-stone-200 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>View live site</span>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
      {/* Mobile top bar — replaces the always-visible sidebar below the md breakpoint */}
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

      {/* Backdrop for the mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: off-canvas drawer on mobile, static column from md up */}
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
