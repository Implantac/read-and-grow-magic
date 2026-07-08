import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SuccessMonthlyRevenue {
  month: string; // YYYY-MM
  label: string; // MMM/YY
  revenue: number;
}

export interface SuccessTopCustomer {
  client_id: string | null;
  client_name: string;
  total: number;
  orders: number;
  last_purchase_days: number | null;
}

export interface SuccessDelinquent {
  client_name: string;
  amount: number;
  days_overdue: number;
  invoice: string;
}

export interface SuccessProductInsight {
  product_code: string;
  product_name: string;
  quantity: number;
  unit: string;
  sold_last_90d: number;
  revenue_last_90d: number;
  margin_pct: number;
  sale_price: number;
  cost_price: number;
  capital_locked: number;
}

export interface SuccessSubcategoryStock {
  subcategory: string;
  skus: number;
  stock_qty: number;
  capital_locked: number;
  sold_90d: number;
  turnover_ratio: number; // sold_90d / stock_qty
  stagnation_pct: number; // % of SKUs with 0 sales in 90d
}

export interface SuccessSupplierSpend {
  supplier_name: string;
  spend_90d: number;
  orders: number;
  share_pct: number;
  potential_savings: number;
}

export interface SuccessCashFlow90d {
  projected_inflow: number;
  projected_outflow: number;
  net: number;
  overdue_ar: number;
  overdue_ap: number;
  inflow_30: number;
  inflow_60: number;
  inflow_90: number;
  outflow_30: number;
  outflow_60: number;
  outflow_90: number;
}

export type HealthPillarKey = "cashflow" | "delinquency" | "margin" | "trend";

export interface HealthPillar {
  key: HealthPillarKey;
  label: string;
  score: number;
  weight: number;
  contribution: number;
  status: "good" | "warn" | "bad";
  metricLabel: string;
  metricValue: string;
  explanation: string;
}

export interface SuccessHealthBreakdown {
  score: number;
  grade: "A" | "B" | "C" | "D" | "E";
  financial: number;
  operational: number;
  commercial: number;
  drivers: string[];
  pillars: HealthPillar[];
}

export interface SuccessAIRecommendation {
  id: string;
  icon: "warning" | "opportunity" | "insight" | "alert";
  title: string;
  detail: string;
  impact?: string;
  priority: number; // 1 = crítica, 5 = informativa
}

export interface SuccessData {
  health: SuccessHealthBreakdown;
  revenue12m: SuccessMonthlyRevenue[];
  cashflow: SuccessCashFlow90d;
  slowMoving: SuccessProductInsight[];
  topMargin: SuccessProductInsight[];
  bestSellers: SuccessProductInsight[];
  subcategoryStock: SuccessSubcategoryStock[];
  topSuppliers: SuccessSupplierSpend[];
  topCustomers: SuccessTopCustomer[];
  inactiveTopCustomers: SuccessTopCustomer[];
  delinquents: SuccessDelinquent[];
  monthGoal: { goal: number; achieved: number; pct: number };
  recommendations: SuccessAIRecommendation[];
  totals: {
    revenueYTD: number;
    revenueMonth: number;
    revenuePrevMonth: number;
    revenueWeek: number;
    revenuePrevWeek: number;
    activeCustomers: number;
    ordersOpen: number;
    stagnantSkuCount: number;
    stagnantCapital: number;
  };
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

export function useSuccessData() {
  return useQuery({
    queryKey: ["success_dashboard"],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<SuccessData> => {
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);

      const [salesRes, arRes, apRes, productsRes, stockRes, ordersRes, saleItemsRes, poRes] = await Promise.all([
        supabase.from("sales").select("id, client_id, client_name, total, date").gte("date", twelveMonthsAgo.toISOString()),
        supabase.from("accounts_receivable").select("client_name, amount, due_date, status, invoice_number, payment_date, category"),
        supabase.from("accounts_payable").select("amount, due_date, status, payment_date"),
        supabase.from("products").select("id, code, name, sale_price, cost_price, unit, subcategory").eq("status", "active"),
        supabase.from("stock_balances").select("product_id, product_code, product_name, quantity, unit"),
        supabase.from("orders").select("id, status, total").in("status", ["pending", "approved", "processing"]),
        supabase
          .from("sale_items")
          .select("product_id, product_code, product_name, quantity, total, sale_id, sales!inner(date, client_id, client_name)")
          .gte("sales.date", ninetyDaysAgo.toISOString()),
        supabase
          .from("purchase_orders")
          .select("supplier_name, total, date, status")
          .gte("date", ninetyDaysAgo.toISOString()),
      ]);

      const sales = salesRes.data ?? [];
      const ar = arRes.data ?? [];
      const ap = apRes.data ?? [];
      const products = productsRes.data ?? [];
      const stock = stockRes.data ?? [];
      const orders = ordersRes.data ?? [];
      const saleItems90 = (saleItemsRes.data ?? []) as any[];
      const purchaseOrders90 = poRes.data ?? [];

      // --- Revenue 12m ---
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

      // --- Totals ---
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

      // --- Cash Flow 90d ---
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
      const cashflow: SuccessCashFlow90d = {
        projected_inflow: inflow_30 + inflow_60 + inflow_90,
        projected_outflow: outflow_30 + outflow_60 + outflow_90,
        net: inflow_30 + inflow_60 + inflow_90 - outflow_30 - outflow_60 - outflow_90,
        overdue_ar,
        overdue_ap,
        inflow_30, inflow_60, inflow_90,
        outflow_30, outflow_60, outflow_90,
      };

      // --- Real product movement in last 90d (via sale_items) ---
      const soldQtyMap = new Map<string, number>();     // by product_code
      const soldRevMap = new Map<string, number>();
      for (const it of saleItems90) {
        const code = String(it.product_code || "");
        if (!code) continue;
        soldQtyMap.set(code, (soldQtyMap.get(code) ?? 0) + Number(it.quantity || 0));
        soldRevMap.set(code, (soldRevMap.get(code) ?? 0) + Number(it.total || 0));
      }

      const productByCode = new Map(products.map((p) => [p.code, p]));

      const productInsights: SuccessProductInsight[] = stock.map((s) => {
        const p = productByCode.get(s.product_code);
        const sale = Number(p?.sale_price || 0);
        const cost = Number(p?.cost_price || 0);
        const margin = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
        const qty = Number(s.quantity || 0);
        const sold = soldQtyMap.get(s.product_code) ?? 0;
        const rev = soldRevMap.get(s.product_code) ?? 0;
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
          capital_locked: Math.round(qty * cost * 100) / 100,
        };
      });

      // Slow-moving = com estoque > 0 e ZERO vendas em 90d, ordenado por capital imobilizado
      const slowMoving = productInsights
        .filter((p) => p.quantity > 0 && p.sold_last_90d === 0)
        .sort((a, b) => b.capital_locked - a.capital_locked)
        .slice(0, 6);

      // Top margin = itens efetivamente vendidos, ranqueados por margem × qtd vendida (impacto real)
      const topMargin = productInsights
        .filter((p) => p.sale_price > 0 && p.sold_last_90d > 0)
        .map((p) => ({ ...p, _impact: p.revenue_last_90d * (p.margin_pct / 100) }))
        .sort((a: any, b: any) => b._impact - a._impact)
        .slice(0, 6)
        .map(({ _impact, ...p }: any) => p as SuccessProductInsight);

      // Best sellers = maior receita nos últimos 90d
      const bestSellers = productInsights
        .filter((p) => p.sold_last_90d > 0)
        .sort((a, b) => b.revenue_last_90d - a.revenue_last_90d)
        .slice(0, 6);

      const stagnantSkuCount = productInsights.filter((p) => p.quantity > 0 && p.sold_last_90d === 0).length;
      const stagnantCapital = productInsights
        .filter((p) => p.quantity > 0 && p.sold_last_90d === 0)
        .reduce((a, b) => a + b.capital_locked, 0);

      // --- Subcategory Stock (agregado por família de confecção) ---
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

      // --- Suppliers 90d ---
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
      const topSuppliers: SuccessSupplierSpend[] = Array.from(supMap.entries())
        .map(([supplier_name, v]) => ({
          supplier_name,
          spend_90d: Math.round(v.spend * 100) / 100,
          orders: v.orders,
          share_pct: totalSpend90 > 0 ? Math.round((v.spend / totalSpend90) * 1000) / 10 : 0,
          potential_savings: Math.round(v.spend * 0.05 * 100) / 100, // premissa: 5% renegociando
        }))
        .sort((a, b) => b.spend_90d - a.spend_90d)
        .slice(0, 5);

      // --- Top Customers com data da última compra ---
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
      const activeCustomers = custMap.size;

      // --- Delinquents ---
      const delinquents: SuccessDelinquent[] = ar
        .filter((r) => r.status !== "paid" && new Date(r.due_date).getTime() < now.getTime())
        .map((r) => ({
          client_name: r.client_name,
          amount: Number(r.amount || 0),
          days_overdue: Math.floor((now.getTime() - new Date(r.due_date).getTime()) / 86400000),
          invoice: r.invoice_number || "-",
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);

      // --- Month Goal (heurística: 105% do mês anterior) ---
      const goal = revenuePrevMonth > 0 ? revenuePrevMonth * 1.05 : revenueYTD / 12;
      const pct = goal > 0 ? (revenueMonth / goal) * 100 : 0;

      // --- Health Score ---
      const grossMarginAvg =
        productInsights.length > 0
          ? productInsights.reduce((a, b) => a + b.margin_pct, 0) / productInsights.length
          : 30;
      const arTotal = ar.reduce((a, r) => a + (r.status === "paid" ? 0 : Number(r.amount || 0)), 0);
      const delinquencyRatio = arTotal > 0 ? overdue_ar / arTotal : 0;
      const cashScore = Math.max(0, Math.min(100, 50 + (cashflow.net / 100000) * 5));
      const marginScore = Math.max(0, Math.min(100, grossMarginAvg * 2));
      const arScore = Math.max(0, Math.min(100, 100 - delinquencyRatio * 200));
      const trendScore = revenuePrevMonth > 0
        ? Math.max(0, Math.min(100, 50 + ((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 200))
        : 60;
      const financial = Math.round((cashScore * 0.5) + (arScore * 0.5));
      const operational = Math.round(marginScore);
      const commercial = Math.round(trendScore);
      const score = Math.round(financial * 0.45 + operational * 0.3 + commercial * 0.25);
      const grade: SuccessHealthBreakdown["grade"] =
        score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "E";

      const wCash = 0.30, wDelq = 0.25, wMargin = 0.25, wTrend = 0.20;
      const trendPct = revenuePrevMonth > 0 ? ((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100 : 0;

      const pillars: HealthPillar[] = [
        {
          key: "cashflow", label: "Fluxo de caixa",
          score: Math.round(cashScore), weight: wCash,
          contribution: Math.round(cashScore * wCash * 10) / 10,
          status: cashflow.net >= 0 ? (cashflow.net > 50000 ? "good" : "warn") : "bad",
          metricLabel: "Saldo líquido projetado 90d",
          metricValue: cashflow.net.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }),
          explanation: cashflow.net >= 0
            ? "Entradas projetadas superam saídas — capacidade de honrar compromissos preservada."
            : "Saídas projetadas maiores que entradas — risco de aperto de caixa nos próximos 90 dias.",
        },
        {
          key: "delinquency", label: "Inadimplência",
          score: Math.round(arScore), weight: wDelq,
          contribution: Math.round(arScore * wDelq * 10) / 10,
          status: delinquencyRatio <= 0.05 ? "good" : delinquencyRatio <= 0.15 ? "warn" : "bad",
          metricLabel: "% da carteira vencida",
          metricValue: `${(delinquencyRatio * 100).toFixed(1)}%`,
          explanation: delinquencyRatio <= 0.05
            ? "Carteira saudável, cobrança sob controle."
            : delinquencyRatio <= 0.15
            ? "Nível moderado de atraso — priorize régua de cobrança."
            : "Inadimplência elevada compromete o caixa e reduz a nota do pilar.",
        },
        {
          key: "margin", label: "Margem bruta",
          score: Math.round(marginScore), weight: wMargin,
          contribution: Math.round(marginScore * wMargin * 10) / 10,
          status: grossMarginAvg >= 35 ? "good" : grossMarginAvg >= 20 ? "warn" : "bad",
          metricLabel: "Margem média do portfólio",
          metricValue: `${grossMarginAvg.toFixed(1)}%`,
          explanation: grossMarginAvg >= 35
            ? "Portfólio com boa rentabilidade unitária."
            : grossMarginAvg >= 20
            ? "Margem aceitável — revise preços e custos dos itens fracos."
            : "Margem baixa — cada real vendido gera pouco lucro; risco operacional.",
        },
        {
          key: "trend", label: "Tendência de vendas",
          score: Math.round(trendScore), weight: wTrend,
          contribution: Math.round(trendScore * wTrend * 10) / 10,
          status: trendPct >= 0 ? (trendPct >= 5 ? "good" : "warn") : "bad",
          metricLabel: "Variação vs. mês anterior",
          metricValue: `${trendPct >= 0 ? "+" : ""}${trendPct.toFixed(1)}%`,
          explanation: trendPct >= 5
            ? "Vendas acelerando — momento favorável para investir em expansão."
            : trendPct >= 0
            ? "Vendas estáveis — sem tração, mas sem retração."
            : "Queda vs. mês anterior — puxa a nota para baixo e pede reação comercial.",
        },
      ];

      const drivers: string[] = [];
      if (delinquencyRatio > 0.15) drivers.push(`Inadimplência alta (${(delinquencyRatio * 100).toFixed(0)}%)`);
      if (cashflow.net < 0) drivers.push("Saldo projetado 90d negativo");
      if (grossMarginAvg < 20) drivers.push("Margem média baixa (<20%)");
      if (revenueMonth < revenuePrevMonth * 0.9) drivers.push("Queda de faturamento vs mês anterior");
      if (drivers.length === 0) drivers.push("Indicadores dentro do esperado");

      // ================================================================
      // AI-STYLE RECOMMENDATIONS — data-driven, concrete numbers, PT-BR
      // ================================================================
      const recommendations: SuccessAIRecommendation[] = [];
      const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

      // 1) Estoque acima do ideal por família (ex.: camisetas)
      const bloatedSub = subcategoryStock.find((s) => s.stagnation_pct >= 40 && s.capital_locked > 1000);
      if (bloatedSub) {
        recommendations.push({
          id: "sub-overstock",
          icon: "warning",
          priority: 2,
          title: `Estoque de ${bloatedSub.subcategory.toLowerCase()} acima do ideal`,
          detail: `${bloatedSub.stagnation_pct}% dos SKUs desta família não venderam nos últimos 90 dias. Considere promoção sazonal ou liquidação de grade.`,
          impact: `Capital parado: ${brl(bloatedSub.capital_locked)} em ${bloatedSub.skus} SKUs`,
        });
      }

      // 2) SKUs específicos sem giro (top 3)
      if (slowMoving.length >= 3) {
        const top3 = slowMoving.slice(0, 3);
        const totalLocked = top3.reduce((a, b) => a + b.capital_locked, 0);
        recommendations.push({
          id: "stagnant-skus",
          icon: "warning",
          priority: 3,
          title: `${stagnantSkuCount} SKUs sem venda em 90 dias`,
          detail: `Priorize liquidar: ${top3.map((p) => p.product_name.split(" - ")[0]).join(", ")}. Sugestão: outlet com 30-40% off ou combos.`,
          impact: `Capital parado top 3: ${brl(totalLocked)}`,
        });
      }

      // 3) Queda de vendas semanal
      if (revenueWeek < revenuePrevWeek * 0.9 && revenuePrevWeek > 0) {
        const drop = ((revenuePrevWeek - revenueWeek) / revenuePrevWeek) * 100;
        recommendations.push({
          id: "weekly-drop",
          icon: "alert",
          priority: 1,
          title: `Vendas caíram ${drop.toFixed(0)}% nesta semana`,
          detail: `Faturamento da semana ${brl(revenueWeek)} vs. ${brl(revenuePrevWeek)} da anterior. Ative campanha comercial, revise pipeline no CRM e reforce metas do time.`,
          impact: `Impacto semanal: ${brl(revenuePrevWeek - revenueWeek)}`,
        });
      }

      // 4) Clientes VIP inativos
      if (inactiveTopCustomers.length > 0) {
        const names = inactiveTopCustomers.slice(0, 3).map((c) => c.client_name).join(", ");
        recommendations.push({
          id: "inactive-vip",
          icon: "insight",
          priority: 2,
          title: `${inactiveTopCustomers.length} clientes importantes sem comprar há +60 dias`,
          detail: `Reative agora: ${names}${inactiveTopCustomers.length > 3 ? "…" : ""}. Ligue, envie catálogo de nova coleção ou ofereça condição especial de fidelidade.`,
          impact: `Ticket médio destes: ${brl(
            inactiveTopCustomers.reduce((a, b) => a + b.total / Math.max(b.orders, 1), 0) / inactiveTopCustomers.length,
          )}`,
        });
      }

      // 5) Concentração de fornecedor + economia potencial
      const concentratedSupplier = topSuppliers.find((s) => s.share_pct >= 40 && s.spend_90d > 5000);
      if (concentratedSupplier) {
        recommendations.push({
          id: "supplier-savings",
          icon: "opportunity",
          priority: 3,
          title: `Renegocie com ${concentratedSupplier.supplier_name}`,
          detail: `${concentratedSupplier.share_pct.toFixed(0)}% das suas compras (últimos 90d) vieram deste fornecedor. Com este volume, uma renegociação de 5% em preço ou prazo é factível.`,
          impact: `Economia estimada: ${brl(concentratedSupplier.potential_savings)} em 90 dias`,
        });
      }

      // 6) Inadimplência acima do saudável
      if (overdue_ar > 0 && delinquencyRatio > 0.05) {
        recommendations.push({
          id: "overdue-ar",
          icon: "warning",
          priority: 1,
          title: `${brl(overdue_ar)} em contas vencidas`,
          detail: `${delinquents.length} clientes com atraso. Recomendado: régua automática (7/15/30 dias), oferta de renegociação para +30d e boletos de pagamento antecipado com desconto.`,
          impact: `${(delinquencyRatio * 100).toFixed(1)}% da carteira em atraso`,
        });
      }

      // 7) Fluxo de caixa negativo
      if (cashflow.net < 0) {
        recommendations.push({
          id: "cash-negative",
          icon: "alert",
          priority: 1,
          title: "Fluxo de caixa 90d projetado NEGATIVO",
          detail: `Déficit de ${brl(Math.abs(cashflow.net))} nos próximos 90 dias. Ações: antecipar recebíveis (${brl(cashflow.projected_inflow * 0.3)} disponível), renegociar pagáveis, cortar compras não essenciais.`,
          impact: `Gap a cobrir: ${brl(Math.abs(cashflow.net))}`,
        });
      }

      // 8) Oportunidade: produto de alta margem com boa saída
      if (topMargin[0] && topMargin[0].revenue_last_90d > 500) {
        recommendations.push({
          id: "top-margin-opportunity",
          icon: "opportunity",
          priority: 4,
          title: `Amplie mix de ${topMargin[0].product_name.split(" - ")[0]}`,
          detail: `Vendeu ${topMargin[0].sold_last_90d} un em 90d com ${topMargin[0].margin_pct}% de margem. Aumentar exposição na loja e treinar equipe pode elevar receita significativamente.`,
          impact: `Margem gerada: ${brl(topMargin[0].revenue_last_90d * (topMargin[0].margin_pct / 100))} em 90d`,
        });
      }

      // 9) Meta do mês em risco
      if (pct < 60 && new Date().getDate() > 15) {
        recommendations.push({
          id: "goal-at-risk",
          icon: "alert",
          priority: 2,
          title: `Meta do mês em risco: ${pct.toFixed(0)}% atingido`,
          detail: `Faltam ${brl(goal - revenueMonth)} para bater a meta. Considere blitz de vendas no fim de semana, WhatsApp para clientes VIP ou promoção-relâmpago de 48h.`,
          impact: `Gap para meta: ${brl(goal - revenueMonth)}`,
        });
      }

      if (recommendations.length === 0) {
        recommendations.push({
          id: "healthy",
          icon: "opportunity",
          priority: 5,
          title: "Empresa saudável",
          detail: "Nenhum alerta crítico detectado. Bom momento para investir em expansão de coleção ou nova filial.",
        });
      }

      recommendations.sort((a, b) => a.priority - b.priority);

      return {
        health: { score, grade, financial, operational, commercial, drivers, pillars },
        revenue12m,
        cashflow,
        slowMoving,
        topMargin,
        bestSellers,
        subcategoryStock,
        topSuppliers,
        topCustomers,
        inactiveTopCustomers,
        delinquents,
        monthGoal: { goal, achieved: revenueMonth, pct },
        recommendations,
        totals: {
          revenueYTD,
          revenueMonth,
          revenuePrevMonth,
          revenueWeek,
          revenuePrevWeek,
          activeCustomers,
          ordersOpen: orders.length,
          stagnantSkuCount,
          stagnantCapital,
        },
      };
    },
  });
}
