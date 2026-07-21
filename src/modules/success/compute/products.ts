import type { SuccessProductInsight, SuccessSubcategoryStock } from "../types";

export function buildProductInsights(
  products: any[],
  stock: any[],
  saleItems90: any[],
  saleItems12m: any[],
  now: Date,
) {
  const soldQtyMap = new Map<string, number>();
  const soldRevMap = new Map<string, number>();
  for (const it of saleItems90) {
    const code = String(it.product_code || "");
    if (!code) continue;
    soldQtyMap.set(code, (soldQtyMap.get(code) ?? 0) + Number(it.quantity || 0));
    soldRevMap.set(code, (soldRevMap.get(code) ?? 0) + Number(it.total || 0));
  }

  const lastSaleMap = new Map<string, number>();
  for (const it of saleItems12m) {
    const code = String(it.product_code || "");
    if (!code) continue;
    const t = new Date(it.sales?.date).getTime();
    if (!Number.isFinite(t)) continue;
    const cur = lastSaleMap.get(code);
    if (cur === undefined || t > cur) lastSaleMap.set(code, t);
  }

  const productByCode = new Map(products.map((p) => [p.code, p]));

  const productInsights: SuccessProductInsight[] = stock.map((s) => {
    const p = productByCode.get(s.product_code) as any;
    const sale = Number(p?.sale_price || 0);
    const cost = Number(p?.cost_price || 0);
    const margin = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
    const qty = Number(s.quantity || 0);
    const sold = soldQtyMap.get(s.product_code) ?? 0;
    const rev = soldRevMap.get(s.product_code) ?? 0;
    const lastMs = lastSaleMap.get(s.product_code);
    const lastIso = lastMs ? new Date(lastMs).toISOString() : null;
    const daysSince = lastMs ? Math.floor((now.getTime() - lastMs) / 86400000) : null;
    const capital = Math.round(qty * cost * 100) / 100;

    const reasons: string[] = [];
    if (qty > 0 && sold === 0) {
      reasons.push(
        daysSince === null
          ? "Sem registro de venda nos últimos 12 meses"
          : `Sem vender há ${daysSince} dias`,
      );
    }
    if (margin < 15 && sale > 0) reasons.push(`Margem baixa (${Math.round(margin)}%) — pouco lucro por unidade`);
    if (margin >= 45) reasons.push(`Alta margem (${Math.round(margin)}%) — item premium`);
    if (capital >= 5000 && sold === 0) reasons.push(`Capital elevado imobilizado (${Math.round(capital / 1000)}k)`);
    if (qty > 0 && sold > 0 && qty / Math.max(sold, 1) > 6) {
      reasons.push(`Cobertura alta: estoque cobre ~${Math.round(qty / Math.max(sold, 1))} ciclos de venda`);
    }
    if (sold > 0 && rev > 0 && sold >= 20) reasons.push(`Alta rotatividade: ${sold} un vendidas em 90d`);
    if (p?.subcategory) reasons.push(`Família: ${p.subcategory}`);

    return {
      product_code: s.product_code,
      product_name: s.product_name,
      quantity: qty,
      unit: s.unit || "UN",
      sold_last_90d: sold,
      revenue_last_90d: rev,
      margin_pct: Math.round(margin * 10) / 10,
      sale_price: sale,
      cost_price: cost,
      capital_locked: capital,
      subcategory: p?.subcategory,
      last_sale_at: lastIso,
      days_since_last_sale: daysSince,
      reasons,
    };
  });

  const slowMoving = productInsights
    .filter((p) => p.quantity > 0 && p.sold_last_90d === 0)
    .sort((a, b) => b.capital_locked - a.capital_locked)
    .slice(0, 6);

  const topMargin = productInsights
    .filter((p) => p.sale_price > 0 && p.sold_last_90d > 0)
    .map((p) => ({ ...p, _impact: p.revenue_last_90d * (p.margin_pct / 100) }))
    .sort((a: any, b: any) => b._impact - a._impact)
    .slice(0, 6)
    .map(({ _impact, ...p }: any) => p as SuccessProductInsight);

  const bestSellers = productInsights
    .filter((p) => p.sold_last_90d > 0)
    .sort((a, b) => b.revenue_last_90d - a.revenue_last_90d)
    .slice(0, 6);

  const stagnantSkuCount = productInsights.filter((p) => p.quantity > 0 && p.sold_last_90d === 0).length;
  const stagnantCapital = productInsights
    .filter((p) => p.quantity > 0 && p.sold_last_90d === 0)
    .reduce((a, b) => a + b.capital_locked, 0);

  // Subcategory aggregation
  const subMap = new Map<string, { skus: number; stock_qty: number; capital: number; sold: number; stagnant: number }>();
  for (const p of products) {
    const sub = (p as any).subcategory || "Outros";
    const cur = subMap.get(sub) || { skus: 0, stock_qty: 0, capital: 0, sold: 0, stagnant: 0 };
    cur.skus += 1;
    subMap.set(sub, cur);
  }
  for (const pi of productInsights) {
    const prod = productByCode.get(pi.product_code) as any;
    const sub = prod?.subcategory || "Outros";
    const cur = subMap.get(sub);
    if (!cur) continue;
    cur.stock_qty += pi.quantity;
    cur.capital += pi.capital_locked;
    cur.sold += pi.sold_last_90d;
    if (pi.quantity > 0 && pi.sold_last_90d === 0) cur.stagnant += 1;
  }
  const subcategoryStock: SuccessSubcategoryStock[] = Array.from(subMap.entries())
    .map(([subcategory, v]) => ({
      subcategory,
      skus: v.skus,
      stock_qty: Math.round(v.stock_qty),
      capital_locked: Math.round(v.capital * 100) / 100,
      sold_90d: Math.round(v.sold),
      turnover_ratio: v.stock_qty > 0 ? Math.round((v.sold / v.stock_qty) * 100) / 100 : 0,
      stagnation_pct: v.skus > 0 ? Math.round((v.stagnant / v.skus) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.capital_locked - a.capital_locked);

  return { productInsights, slowMoving, topMargin, bestSellers, stagnantSkuCount, stagnantCapital, subcategoryStock };
}
