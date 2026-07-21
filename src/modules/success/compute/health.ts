import type { HealthPillar, SuccessCashFlow90d, SuccessHealthBreakdown, SuccessProductInsight } from "../types";

export function buildHealth(params: {
  productInsights: SuccessProductInsight[];
  ar: any[];
  cashflow: SuccessCashFlow90d;
  revenueMonth: number;
  revenuePrevMonth: number;
}): SuccessHealthBreakdown & { grossMarginAvg: number; delinquencyRatio: number; trendPct: number } {
  const { productInsights, ar, cashflow, revenueMonth, revenuePrevMonth } = params;

  const grossMarginAvg =
    productInsights.length > 0
      ? productInsights.reduce((a, b) => a + b.margin_pct, 0) / productInsights.length
      : 30;
  const arTotal = ar.reduce((a, r) => a + (r.status === "paid" ? 0 : Number(r.amount || 0)), 0);
  const delinquencyRatio = arTotal > 0 ? cashflow.overdue_ar / arTotal : 0;
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
      metricValue: cashflow.net.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }),
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

  return { score, grade, financial, operational, commercial, drivers, pillars, grossMarginAvg, delinquencyRatio, trendPct };
}
