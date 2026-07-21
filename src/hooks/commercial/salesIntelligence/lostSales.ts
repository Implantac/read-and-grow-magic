import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import type { FunnelLike, OrderLike, FollowUpLike, LostSaleAlert } from './types';

export function useLostSalesAlerts(funnel: FunnelLike[], orders: OrderLike[], followUps: FollowUpLike[]) {
  return useMemo(() => {
    const now = new Date();
    const alerts: LostSaleAlert[] = [];

    funnel.filter(f => f.status === 'open').forEach(f => {
      const days = differenceInDays(now, new Date(f.updated_at || f.created_at));
      if (days > 14) {
        alerts.push({
          type: 'stagnant_funnel',
          title: `Oportunidade parada: ${f.title}`,
          description: `Parada há ${days} dias na etapa atual. Valor: R$ ${f.value.toFixed(2)}`,
          estimatedLoss: f.value,
          referenceId: f.id,
          daysSince: days,
          clientName: f.contact_name || 'N/A',
        });
      }
    });

    orders.filter(o => o.status === 'cancelled').forEach(o => {
      const days = differenceInDays(now, new Date(o.date));
      if (days <= 30) {
        alerts.push({
          type: 'cancelled_order',
          title: `Pedido cancelado: ${o.number}`,
          description: `Cancelado há ${days} dias. Cliente: ${o.client_name}`,
          estimatedLoss: o.total,
          referenceId: o.id,
          daysSince: days,
          clientName: o.client_name ?? 'N/A',
        });
      }
    });

    followUps.filter(f => f.status === 'pending').forEach(f => {
      const days = differenceInDays(now, new Date(f.scheduled_date));
      if (days > 3) {
        alerts.push({
          type: 'no_followup',
          title: `Follow-up atrasado: ${f.subject}`,
          description: `Atrasado há ${days} dias sem retorno`,
          estimatedLoss: 0,
          referenceId: f.id,
          daysSince: days,
          clientName: f.subject,
        });
      }
    });

    alerts.sort((a, b) => b.estimatedLoss - a.estimatedLoss);
    return alerts;
  }, [funnel, orders, followUps]);
}
