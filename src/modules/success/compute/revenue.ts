import { monthKey, monthLabel } from "../helpers";
import type { SuccessMonthlyRevenue } from "../types";

export function buildRevenue12m(sales: any[], now: Date) {
  const revMap = new Map<string, { d: Date; total: number }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    revMap.set(monthKey(d), { d, total: 0 });
  }
  for (const s of sales) {
    const d = new Date(s.date);
    const key = monthKey(d);
    const bucket = revMap.get(key);
    if (bucket) bucket.total += Number(s.total || 0);
  }
  const revenue12m: SuccessMonthlyRevenue[] = Array.from(revMap.entries()).map(([month, v]) => ({
    month,
    label: monthLabel(v.d),
    revenue: Math.round(v.total * 100) / 100,
  }));

  const monthKeyNow = monthKey(now);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthKeyPrev = monthKey(prevMonthDate);
  const revenueMonth = revMap.get(monthKeyNow)?.total ?? 0;
  const revenuePrevMonth = revMap.get(monthKeyPrev)?.total ?? 0;
  const revenueYTD = revenue12m.reduce((a, b) => a + b.revenue, 0);

  const sevenDaysAgo = now.getTime() - 7 * 86400000;
  const fourteenDaysAgo = now.getTime() - 14 * 86400000;
  let revenueWeek = 0;
  let revenuePrevWeek = 0;
  for (const s of sales) {
    const t = new Date(s.date).getTime();
    if (t >= sevenDaysAgo) revenueWeek += Number(s.total || 0);
    else if (t >= fourteenDaysAgo) revenuePrevWeek += Number(s.total || 0);
  }

  return { revenue12m, revenueMonth, revenuePrevMonth, revenueYTD, revenueWeek, revenuePrevWeek };
}
