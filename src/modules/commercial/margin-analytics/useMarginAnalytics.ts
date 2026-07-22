import { useMemo } from 'react';
import { PERIODS } from './utils';

export function useMarginAnalytics(allOrders: any[] | undefined, period: string) {
  const orders = useMemo(() => {
    if (!allOrders) return allOrders;
    const days = PERIODS[period]?.days;
    if (!days) return allOrders;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return allOrders.filter((o) => new Date(o.date) >= cutoff);
  }, [allOrders, period]);

  const analytics = useMemo(() => {
    if (!orders || orders.length === 0) return null;

    const withSnap = orders.filter(
      (o) => o.estimated_margin_pct !== null && o.estimated_margin_pct !== undefined,
    );
    const withoutCost = orders.filter(
      (o) => o.estimated_cost === null || o.estimated_cost === undefined || Number(o.estimated_cost) === 0,
    );

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    const totalCost = withSnap.reduce((s, o) => s + Number(o.estimated_cost || 0), 0);
    const totalTax = withSnap.reduce((s, o) => s + Number(o.estimated_tax || 0), 0);
    const avgMargin =
      withSnap.length > 0
        ? withSnap.reduce((s, o) => s + Number(o.estimated_margin_pct || 0), 0) / withSnap.length
        : 0;

    const green = withSnap.filter((o) => Number(o.estimated_margin_pct) >= 20).length;
    const yellow = withSnap.filter(
      (o) => Number(o.estimated_margin_pct) >= 8 && Number(o.estimated_margin_pct) < 20,
    ).length;
    const red = withSnap.filter((o) => Number(o.estimated_margin_pct) < 8).length;

    const sorted = [...withSnap].sort(
      (a, b) => Number(a.estimated_margin_pct) - Number(b.estimated_margin_pct),
    );
    const bottom = sorted.slice(0, 5);
    const top = sorted.slice(-5).reverse();

    const aggregate = (keyFn: (o: any) => string | null) => {
      const map = new Map<string, { key: string; revenue: number; cost: number; tax: number; marginSum: number; count: number }>();
      for (const o of withSnap) {
        const k = keyFn(o);
        if (!k) continue;
        const cur = map.get(k) ?? { key: k, revenue: 0, cost: 0, tax: 0, marginSum: 0, count: 0 };
        cur.revenue += Number(o.total || 0);
        cur.cost += Number(o.estimated_cost || 0);
        cur.tax += Number(o.estimated_tax || 0);
        cur.marginSum += Number(o.estimated_margin_pct || 0);
        cur.count += 1;
        map.set(k, cur);
      }
      return Array.from(map.values())
        .map((v) => ({ ...v, avgMargin: v.count > 0 ? v.marginSum / v.count : 0 }))
        .sort((a, b) => b.revenue - a.revenue);
    };

    return {
      totalRevenue,
      totalCost,
      totalTax,
      avgMargin,
      green,
      yellow,
      red,
      withoutCost,
      top,
      bottom,
      snapCount: withSnap.length,
      bySalesRep: aggregate((o) => o.sales_rep_name || null),
      byClient: aggregate((o) => o.client_name || null).slice(0, 8),
    };
  }, [orders]);

  const trend = useMemo(() => {
    if (!orders) return [];
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    const byDay = new Map<string, { sum: number; count: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      byDay.set(d.toISOString().slice(0, 10), { sum: 0, count: 0 });
    }
    for (const o of orders) {
      if (o.estimated_margin_pct === null || o.estimated_margin_pct === undefined) continue;
      const key = String(o.date).slice(0, 10);
      const bucket = byDay.get(key);
      if (!bucket) continue;
      bucket.sum += Number(o.estimated_margin_pct);
      bucket.count += 1;
    }
    return Array.from(byDay.entries()).map(([date, v]) => ({
      date: date.slice(5),
      margin: v.count > 0 ? Number((v.sum / v.count).toFixed(2)) : null,
    }));
  }, [orders]);

  return { orders, analytics, trend };
}
