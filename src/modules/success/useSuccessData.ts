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
  margin_pct: number;
  sale_price: number;
  cost_price: number;
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
  score: number;         // 0-100 (nota do pilar)
  weight: number;        // 0-1 (peso na composição)
  contribution: number;  // score * weight (pontos aportados ao score final)
  status: "good" | "warn" | "bad";
  metricLabel: string;   // ex.: "Saldo líquido 90d"
  metricValue: string;   // ex.: "R$ 12.400"
  explanation: string;   // como o pilar impacta
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
}

export interface SuccessData {
  health: SuccessHealthBreakdown;
  revenue12m: SuccessMonthlyRevenue[];
  cashflow: SuccessCashFlow90d;
  slowMoving: SuccessProductInsight[];
  topMargin: SuccessProductInsight[];
  topCustomers: SuccessTopCustomer[];
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

      const [salesRes, arRes, apRes, productsRes, stockRes, ordersRes] = await Promise.all([
        supabase.from("sales").select("id, client_id, client_name, total, date").gte("date", twelveMonthsAgo.toISOString()),
        supabase.from("accounts_receivable").select("client_name, amount, due_date, status, invoice_number, payment_date, category"),
        supabase.from("accounts_payable").select("amount, due_date, status, payment_date"),
        supabase.from("products").select("id, code, name, sale_price, cost_price, unit"),
        supabase.from("stock_balances").select("product_id, product_code, product_name, quantity, unit"),
        supabase.from("orders").select("id, status, total").in("status", ["pending", "approved", "processing"]),
      ]);

      const sales = salesRes.data ?? [];
      const ar = arRes.data ?? [];
      const ap = apRes.data ?? [];
      const products = productsRes.data ?? [];
      const stock = stockRes.data ?? [];
      const orders = ordersRes.data ?? [];

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

      // --- Products: slow-moving & top margin ---
      const soldMap = new Map<string, number>(); // product_code → qty (approx by revenue as proxy)
      // We don't have sale_items joined easily here; approximate "moved" by sales count in last 90d per product not available.
      // Use stock qty threshold instead.
      const productByCode = new Map(products.map((p) => [p.code, p]));

      const productInsights: SuccessProductInsight[] = stock.map((s) => {
        const p = productByCode.get(s.product_code);
        const sale = Number(p?.sale_price || 0);
        const cost = Number(p?.cost_price || 0);
        const margin = sale > 0 ? ((sale - cost) / sale) * 100 : 0;
        return {
          product_code: s.product_code,
          product_name: s.product_name,
          quantity: Number(s.quantity || 0),
          unit: s.unit || "UN",
          sold_last_90d: soldMap.get(s.product_code) ?? 0,
          margin_pct: Math.round(margin * 10) / 10,
          sale_price: sale,
          cost_price: cost,
        };
      });

      const slowMoving = [...productInsights].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
      const topMargin = [...productInsights]
        .filter((p) => p.sale_price > 0)
        .sort((a, b) => b.margin_pct - a.margin_pct)
        .slice(0, 5);

      // --- Top Customers ---
      const custMap = new Map<string, SuccessTopCustomer>();
      for (const s of sales) {
        const key = s.client_id || s.client_name || "N/A";
        const existing = custMap.get(key) || {
          client_id: s.client_id,
          client_name: s.client_name || "Cliente",
          total: 0,
          orders: 0,
        };
        existing.total += Number(s.total || 0);
        existing.orders += 1;
        custMap.set(key, existing);
      }
      const topCustomers = Array.from(custMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);
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

      // --- Month Goal (heuristic: 105% of previous month) ---
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

      // --- Pillar breakdown (4 pilares que compõem o score) ---
      const wCash = 0.30;
      const wDelq = 0.25;
      const wMargin = 0.25;
      const wTrend = 0.20;

      const trendPct = revenuePrevMonth > 0 ? ((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100 : 0;

      const pillars: HealthPillar[] = [
        {
          key: "cashflow",
          label: "Fluxo de caixa",
          score: Math.round(cashScore),
          weight: wCash,
          contribution: Math.round(cashScore * wCash * 10) / 10,
          status: cashflow.net >= 0 ? (cashflow.net > 50000 ? "good" : "warn") : "bad",
          metricLabel: "Saldo líquido projetado 90d",
          metricValue: cashflow.net.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }),
          explanation:
            cashflow.net >= 0
              ? "Entradas projetadas superam saídas — capacidade de honrar compromissos preservada."
              : "Saídas projetadas maiores que entradas — risco de aperto de caixa nos próximos 90 dias.",
        },
        {
          key: "delinquency",
          label: "Inadimplência",
          score: Math.round(arScore),
          weight: wDelq,
          contribution: Math.round(arScore * wDelq * 10) / 10,
          status: delinquencyRatio <= 0.05 ? "good" : delinquencyRatio <= 0.15 ? "warn" : "bad",
          metricLabel: "% da carteira vencida",
          metricValue: `${(delinquencyRatio * 100).toFixed(1)}%`,
          explanation:
            delinquencyRatio <= 0.05
              ? "Carteira saudável, cobrança sob controle."
              : delinquencyRatio <= 0.15
              ? "Nível moderado de atraso — priorize régua de cobrança."
              : "Inadimplência elevada compromete o caixa e reduz a nota do pilar.",
        },
        {
          key: "margin",
          label: "Margem bruta",
          score: Math.round(marginScore),
          weight: wMargin,
          contribution: Math.round(marginScore * wMargin * 10) / 10,
          status: grossMarginAvg >= 35 ? "good" : grossMarginAvg >= 20 ? "warn" : "bad",
          metricLabel: "Margem média do portfólio",
          metricValue: `${grossMarginAvg.toFixed(1)}%`,
          explanation:
            grossMarginAvg >= 35
              ? "Portfólio com boa rentabilidade unitária."
              : grossMarginAvg >= 20
              ? "Margem aceitável — revise preços e custos dos itens fracos."
              : "Margem baixa — cada real vendido gera pouco lucro; risco operacional.",
        },
        {
          key: "trend",
          label: "Tendência de vendas",
          score: Math.round(trendScore),
          weight: wTrend,
          contribution: Math.round(trendScore * wTrend * 10) / 10,
          status: trendPct >= 0 ? (trendPct >= 5 ? "good" : "warn") : "bad",
          metricLabel: "Variação vs. mês anterior",
          metricValue: `${trendPct >= 0 ? "+" : ""}${trendPct.toFixed(1)}%`,
          explanation:
            trendPct >= 5
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

      // --- AI Recommendations (heurísticas) ---
      const recommendations: SuccessAIRecommendation[] = [];
      const overstocked = slowMoving[0];
      if (overstocked && overstocked.quantity > 1000) {
        recommendations.push({
          id: "overstock",
          icon: "warning",
          title: `Estoque elevado: ${overstocked.product_name}`,
          detail: `${overstocked.quantity.toLocaleString("pt-BR")} ${overstocked.unit} em estoque — considere promoção ou revisão de compras.`,
          impact: `Capital imobilizado ≈ ${(overstocked.quantity * overstocked.cost_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
        });
      }
      if (revenueWeek < revenuePrevWeek * 0.9 && revenuePrevWeek > 0) {
        const drop = ((revenuePrevWeek - revenueWeek) / revenuePrevWeek) * 100;
        recommendations.push({
          id: "weekly-drop",
          icon: "alert",
          title: `Vendas caíram ${drop.toFixed(0)}% esta semana`,
          detail: "Ative campanha comercial ou revise pipeline no CRM.",
        });
      }
      // Inactive top customers (>60d without buying)
      const lastByClient = new Map<string, number>();
      for (const s of sales) {
        const key = s.client_name || "";
        const t = new Date(s.date).getTime();
        lastByClient.set(key, Math.max(lastByClient.get(key) ?? 0, t));
      }
      const inactive = topCustomers.filter(
        (c) => now.getTime() - (lastByClient.get(c.client_name) ?? 0) > 60 * 86400000,
      );
      if (inactive.length > 0) {
        recommendations.push({
          id: "inactive-top",
          icon: "insight",
          title: `${inactive.length} cliente(s) importantes sem comprar há +60 dias`,
          detail: `Reative: ${inactive.slice(0, 3).map((i) => i.client_name).join(", ")}.`,
        });
      }
      if (overdue_ar > 0) {
        recommendations.push({
          id: "overdue-ar",
          icon: "warning",
          title: `Inadimplência: ${overdue_ar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} vencidos`,
          detail: `${delinquents.length} clientes com contas vencidas. Priorize cobranças acima de 30 dias.`,
        });
      }
      if (cashflow.net < 0) {
        recommendations.push({
          id: "cash-negative",
          icon: "alert",
          title: "Fluxo de caixa 90d projetado negativo",
          detail: `Déficit de ${Math.abs(cashflow.net).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}. Antecipe recebíveis ou renegocie pagamentos.`,
        });
      }
      if (topMargin[0]) {
        recommendations.push({
          id: "top-margin",
          icon: "opportunity",
          title: `Foque em ${topMargin[0].product_name}`,
          detail: `Margem de ${topMargin[0].margin_pct}% — o mais lucrativo do portfólio. Amplie mix e treine vendedores.`,
        });
      }
      if (recommendations.length === 0) {
        recommendations.push({
          id: "healthy",
          icon: "opportunity",
          title: "Empresa saudável",
          detail: "Nenhum alerta crítico detectado. Bom momento para investir em expansão.",
        });
      }

      return {
        health: { score, grade, financial, operational, commercial, drivers },
        revenue12m,
        cashflow,
        slowMoving,
        topMargin,
        topCustomers,
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
        },
      };
    },
  });
}
