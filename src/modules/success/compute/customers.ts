import type { SuccessSupplierSpend, SuccessTopCustomer, SuccessDelinquent } from "../types";

export function buildSuppliers(purchaseOrders90: any[]): SuccessSupplierSpend[] {
  const supMap = new Map<string, { spend: number; orders: number }>();
  for (const po of purchaseOrders90) {
    if ((po as any).status === "cancelled") continue;
    const name = (po as any).supplier_name || "Sem fornecedor";
    const cur = supMap.get(name) || { spend: 0, orders: 0 };
    cur.spend += Number((po as any).total || 0);
    cur.orders += 1;
    supMap.set(name, cur);
  }
  const totalSpend90 = Array.from(supMap.values()).reduce((a, b) => a + b.spend, 0);
  return Array.from(supMap.entries())
    .map(([supplier_name, v]) => ({
      supplier_name,
      spend_90d: Math.round(v.spend * 100) / 100,
      orders: v.orders,
      share_pct: totalSpend90 > 0 ? Math.round((v.spend / totalSpend90) * 1000) / 10 : 0,
      potential_savings: Math.round(v.spend * 0.05 * 100) / 100,
    }))
    .sort((a, b) => b.spend_90d - a.spend_90d)
    .slice(0, 5);
}

export function buildCustomers(sales: any[], now: Date) {
  const custMap = new Map<string, { client_id: string | null; client_name: string; total: number; orders: number; last: number }>();
  for (const s of sales) {
    const key = s.client_id || s.client_name || "N/A";
    const t = new Date(s.date).getTime();
    const existing = custMap.get(key) || {
      client_id: s.client_id,
      client_name: s.client_name || "Cliente",
      total: 0,
      orders: 0,
      last: 0,
    };
    existing.total += Number(s.total || 0);
    existing.orders += 1;
    existing.last = Math.max(existing.last, t);
    custMap.set(key, existing);
  }
  const topCustomersArr: SuccessTopCustomer[] = Array.from(custMap.values())
    .map((c) => ({
      client_id: c.client_id,
      client_name: c.client_name,
      total: c.total,
      orders: c.orders,
      last_purchase_days: c.last > 0 ? Math.floor((now.getTime() - c.last) / 86400000) : null,
    }))
    .sort((a, b) => b.total - a.total);
  const topCustomers = topCustomersArr.slice(0, 6);
  const inactiveTopCustomers = topCustomersArr
    .slice(0, 20)
    .filter((c) => (c.last_purchase_days ?? 0) > 60)
    .slice(0, 5);
  return { topCustomers, inactiveTopCustomers, activeCustomers: custMap.size };
}

export function buildDelinquents(ar: any[], now: Date): SuccessDelinquent[] {
  return ar
    .filter((r) => r.status !== "paid" && new Date(r.due_date).getTime() < now.getTime())
    .map((r) => ({
      client_name: r.client_name,
      amount: Number(r.amount || 0),
      days_overdue: Math.floor((now.getTime() - new Date(r.due_date).getTime()) / 86400000),
      invoice: r.invoice_number || "-",
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
}
