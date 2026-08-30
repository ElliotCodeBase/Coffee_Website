import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/data/auth";

async function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-3xl border border-stone-200 p-6 hover:border-caffeine-dark/30 hover:shadow-md transition-all"
    >
      <p className="text-3xl font-bold text-caffeine-dark font-cozy">{value}</p>
      <p className="text-sm text-stone-500 mt-1">{label}</p>
    </Link>
  );
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const [{ count: menuCount }, { count: reviewCount }, { count: newMsgCount }] = await Promise.all([
    supabase.from("menu_items").select("*", { count: "exact", head: true }),
    supabase.from("reviews").select("*", { count: "exact", head: true }),
    supabase.from("contact_submissions").select("*", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">
          Welcome{user?.profile?.full_name ? `, ${user.profile.full_name}` : ""}
        </h1>
        <p className="text-sm text-stone-500 mt-1">Here&apos;s what&apos;s happening with your site.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-5 max-w-3xl">
        <StatCard label="Menu items" value={menuCount ?? 0} href="/admin/menu" />
        <StatCard label="Published reviews" value={reviewCount ?? 0} href="/admin/reviews" />
        <StatCard label="New messages" value={newMsgCount ?? 0} href="/admin/messages" />
      </div>

      <div className="mt-10 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-3xl">
        <h2 className="font-cozy font-bold text-lg text-caffeine-dark mb-4">Quick links</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/admin/site-info" className="text-sm font-semibold text-caffeine-accent hover:underline">
            Edit logo, hero image & contact info →
          </Link>
          <Link href="/admin/menu" className="text-sm font-semibold text-caffeine-accent hover:underline">
            Manage menu items →
          </Link>
          <Link href="/admin/reviews" className="text-sm font-semibold text-caffeine-accent hover:underline">
            Manage customer reviews →
          </Link>
          <Link href="/admin/messages" className="text-sm font-semibold text-caffeine-accent hover:underline">
            View contact form messages →
          </Link>
        </div>
      </div>
    </div>
  );
}
