export type Granularity = "daily" | "weekly" | "monthly" | "yearly";

export type ChartPoint = { label: string; count: number };

// How many buckets to show per granularity.
const BUCKET_COUNT: Record<Granularity, number> = {
  daily: 30,
  weekly: 12,
  monthly: 12,
  yearly: 5,
};

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0 = Sunday
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day);
  return copy;
}

function bucketKey(date: Date, granularity: Granularity): string {
  const d = new Date(date);
  if (granularity === "daily") return d.toISOString().slice(0, 10);
  if (granularity === "weekly") return startOfWeek(d).toISOString().slice(0, 10);
  if (granularity === "monthly") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  return String(d.getFullYear());
}

function bucketLabel(key: string, granularity: Granularity): string {
  if (granularity === "daily") {
    return new Date(key + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  if (granularity === "weekly") {
    const d = new Date(key + "T00:00:00");
    return `Wk of ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  if (granularity === "monthly") {
    const [year, month] = key.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  return key;
}

/**
 * Buckets raw visit timestamps into fixed-width time buckets for charting,
 * always returning exactly BUCKET_COUNT[granularity] points (zero-filled
 * for buckets with no visits) so the chart never looks broken on a quiet
 * day/week/month.
 */
export function aggregateVisits(timestamps: string[], granularity: Granularity): ChartPoint[] {
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    const key = bucketKey(new Date(ts), granularity);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const points: ChartPoint[] = [];
  const now = new Date();
  const bucketTotal = BUCKET_COUNT[granularity];

  for (let i = bucketTotal - 1; i >= 0; i--) {
    const cursor = new Date(now);
    if (granularity === "daily") cursor.setDate(cursor.getDate() - i);
    else if (granularity === "weekly") cursor.setDate(cursor.getDate() - i * 7);
    else if (granularity === "monthly") cursor.setMonth(cursor.getMonth() - i);
    else cursor.setFullYear(cursor.getFullYear() - i);

    const key = bucketKey(cursor, granularity);
    points.push({ label: bucketLabel(key, granularity), count: counts.get(key) ?? 0 });
  }

  return points;
}
