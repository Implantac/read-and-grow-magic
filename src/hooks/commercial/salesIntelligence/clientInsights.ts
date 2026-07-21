import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import type { ClientInsight, ClientLike, OrderLike, SaleLike } from './types';

export function useClientInsights(clients: ClientLike[], orders: OrderLike[], sales: SaleLike[]) {
  return useMemo(() => {
    const now = new Date();
    const insights: ClientInsight[] = [];

    clients.forEach(client => {
      const clientOrders = orders.filter((o) => o.client_id === client.id && o.status !== 'cancelled');
      const clientSales = sales.filter((s) => s.client_id === client.id && s.status !== 'cancelled');

      const allTransactions = [
        ...clientOrders.map((o) => ({ date: o.date, total: o.total })),
        ...clientSales.map((s) => ({ date: s.date, total: s.total })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastDate = client.last_purchase_date || (allTransactions[0]?.date ?? null);
      const daysSince = lastDate ? differenceInDays(now, new Date(lastDate)) : 999;
      const totalValue = allTransactions.reduce((acc: number, t) => acc + t.total, 0);
      const avgTicket = allTransactions.length > 0 ? totalValue / allTransactions.length : 0;
      const frequency = client.purchase_frequency || 0;
      const potential = client.estimated_potential || 0;

      let riskLevel: ClientInsight['riskLevel'] = 'none';
      let opportunityType = '';
      let suggestedAction = '';

      if (daysSince > 90) {
        riskLevel = 'critical';
        opportunityType = 'reactivation';
        suggestedAction = `Cliente inativo há ${daysSince} dias. Ligar para reativar.`;
      } else if (daysSince > 60) {
        riskLevel = 'high';
        opportunityType = 'winback';
        suggestedAction = `Sem compra há ${daysSince} dias. Oferecer condição especial.`;
      } else if (daysSince > 30) {
        riskLevel = 'medium';
        opportunityType = 'follow_up';
        suggestedAction = `Último pedido há ${daysSince} dias. Fazer follow-up.`;
      } else if (potential > avgTicket * 2) {
        riskLevel = 'low';
        opportunityType = 'upsell';
        suggestedAction = `Potencial de R$ ${potential.toFixed(0)} vs ticket médio R$ ${avgTicket.toFixed(0)}. Oferecer upgrade.`;
      } else if (avgTicket > 0) {
        riskLevel = 'none';
        opportunityType = 'cross_sell';
        suggestedAction = 'Cliente ativo. Sugerir produtos complementares.';
      }

      if (client.status === 'active' && (riskLevel !== 'none' || potential > 0)) {
        insights.push({
          clientId: client.id,
          clientName: client.name,
          clientCode: client.code,
          segment: client.segment,
          lastPurchaseDate: lastDate,
          daysSinceLastPurchase: daysSince,
          totalPurchases: totalValue,
          avgTicket,
          purchaseFrequency: frequency,
          estimatedPotential: potential,
          classification: client.abc_classification,
          score: client.client_score || 'C',
          riskLevel,
          opportunityType,
          suggestedAction,
          salesRepId: client.sales_rep_id,
        });
      }
    });

    insights.sort((a, b) => {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
      const rDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      if (rDiff !== 0) return rDiff;
      return b.estimatedPotential - a.estimatedPotential;
    });

    return insights;
  }, [clients, orders, sales]);
}
