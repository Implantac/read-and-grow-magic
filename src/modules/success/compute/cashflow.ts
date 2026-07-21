import type { SuccessCashFlow90d } from "../types";

export function buildCashflow(ar: any[], ap: any[], now: Date): SuccessCashFlow90d {
  const in30 = new Date(now.getTime() + 30 * 86400000).getTime();
  const in60 = new Date(now.getTime() + 60 * 86400000).getTime();
  const in90 = new Date(now.getTime() + 90 * 86400000).getTime();
  let inflow_30 = 0, inflow_60 = 0, inflow_90 = 0;
  let outflow_30 = 0, outflow_60 = 0, outflow_90 = 0;
  let overdue_ar = 0, overdue_ap = 0;

  for (const r of ar) {
    if (r.status === "paid") continue;
    const t = new Date(r.due_date).getTime();
    const amt = Number(r.amount || 0);
    if (t < now.getTime()) overdue_ar += amt;
    if (t <= in30) inflow_30 += amt;
    else if (t <= in60) inflow_60 += amt;
    else if (t <= in90) inflow_90 += amt;
  }
  for (const p of ap) {
    if (p.status === "paid") continue;
    const t = new Date(p.due_date).getTime();
    const amt = Number(p.amount || 0);
    if (t < now.getTime()) overdue_ap += amt;
    if (t <= in30) outflow_30 += amt;
    else if (t <= in60) outflow_60 += amt;
    else if (t <= in90) outflow_90 += amt;
  }

  return {
    projected_inflow: inflow_30 + inflow_60 + inflow_90,
    projected_outflow: outflow_30 + outflow_60 + outflow_90,
    net: inflow_30 + inflow_60 + inflow_90 - outflow_30 - outflow_60 - outflow_90,
    overdue_ar,
    overdue_ap,
    inflow_30, inflow_60, inflow_90,
    outflow_30, outflow_60, outflow_90,
  };
}
