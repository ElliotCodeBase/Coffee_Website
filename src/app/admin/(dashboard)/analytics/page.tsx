import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/auth";
import { createClient } from "@/lib/supabase/server";
import { aggregateVisits, type Granularity } from "@/lib/analytics";
import VisitorsChart from "@/components/admin/VisitorsChart";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
  const currentUser = await getCurrentUser();

  // Analytics is available to admin and staff (per RBAC spec).
  // Developer is excluded intentionally — they have a separate dev panel.
  const allowedRoles = ["admin", "staff"];
  if (!currentUser || !allowedRoles.includes(currentUser.profile?.role ?? "")) {
    redirect("/admin");
  }

  const supabase = await createClient();
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const { data, error } = await supabase
    .from("site_visits")
    .select("created_at")
    .gte("created_at", fiveYearsAgo.toISOString())
    .order("created_at", { ascending: true })
    .limit(200000);

  if (error) {
    console.error("analytics fetch error:", error.message);
  }

  const timestamps = (data ?? []).map((row) => row.created_at);
  const granularities: Granularity[] = ["daily", "weekly", "monthly", "yearly"];
  const chartData = Object.fromEntries(
    granularities.map((g) => [g, aggregateVisits(timestamps, g)])
  ) as Record<Granularity, ReturnType<typeof aggregateVisits>>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-cozy font-bold text-2xl text-caffeine-dark">Analytics</h1>
        <p className="text-sm text-stone-500 mt-1">
          How many people are visiting your site, broken down by day, week, month, or year.
        </p>
      </div>

      <VisitorsChart data={chartData} totalVisits={timestamps.length} />

      <p className="text-xs text-stone-400 mt-4 max-w-2xl">
        Counted once per browser session (not per page view), with nothing personally identifying
        stored — just a timestamp and the page path.
      </p>
    </div>
  );
}
