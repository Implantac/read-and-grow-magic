import { brl } from "../helpers";
import type {
  SuccessAIRecommendation,
  SuccessCashFlow90d,
  SuccessDelinquent,
  SuccessProductInsight,
  SuccessSubcategoryStock,
  SuccessSupplierSpend,
  SuccessTopCustomer,
} from "../types";

export function buildRecommendations(params: {
  subcategoryStock: SuccessSubcategoryStock[];
  slowMoving: SuccessProductInsight[];
  stagnantSkuCount: number;
  revenueWeek: number;
  revenuePrevWeek: number;
  inactiveTopCustomers: SuccessTopCustomer[];
  topSuppliers: SuccessSupplierSpend[];
  cashflow: SuccessCashFlow90d;
  delinquents: SuccessDelinquent[];
  delinquencyRatio: number;
  topMargin: SuccessProductInsight[];
  pct: number;
  goal: number;
  revenueMonth: number;
}): SuccessAIRecommendation[] {
  const {
    subcategoryStock, slowMoving, stagnantSkuCount, revenueWeek, revenuePrevWeek,
    inactiveTopCustomers, topSuppliers, cashflow, delinquents, delinquencyRatio,
    topMargin, pct, goal, revenueMonth,
  } = params;

  const recommendations: SuccessAIRecommendation[] = [];

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

  if (cashflow.overdue_ar > 0 && delinquencyRatio > 0.05) {
    recommendations.push({
      id: "overdue-ar",
      icon: "warning",
      priority: 1,
      title: `${brl(cashflow.overdue_ar)} em contas vencidas`,
      detail: `${delinquents.length} clientes com atraso. Recomendado: régua automática (7/15/30 dias), oferta de renegociação para +30d e boletos de pagamento antecipado com desconto.`,
      impact: `${(delinquencyRatio * 100).toFixed(1)}% da carteira em atraso`,
    });
  }

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
  return recommendations;
}
