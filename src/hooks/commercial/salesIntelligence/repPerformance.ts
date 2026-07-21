import { useMemo } from 'react';
import type { RepLike, OrderLike, FunnelLike, RepPerformance } from './types';

export function useRepPerformance(reps: RepLike[], orders: OrderLike[], funnel: FunnelLike[]) {
  return useMemo(() => {
    const performances: RepPerformance[] = reps.map(rep => {
      const repOrders = orders.filter((o) => o.sales_rep_id === rep.id && o.status !== 'cancelled');
      const total = repOrders.reduce((acc: number, o) => acc + o.total, 0);
      const repFunnel = funnel.filter((f) => f.sales_rep_id === rep.id);
      const won = repFunnel.filter((f) => f.status === 'won').length;
      const lost = repFunnel.filter((f) => f.status === 'lost').length;
      const conversion = (won + lost) > 0 ? (won / (won + lost)) * 100 : 0;
      const uniqueClients = new Set(repOrders.map((o) => o.client_id)).size;
      const target = rep.monthly_target || 0;

      return {
        repId: rep.id,
        repName: rep.name,
        totalSales: total,
        ordersCount: repOrders.length,
        avgTicket: repOrders.length > 0 ? total / repOrders.length : 0,
        conversionRate: conversion,
        avgCycleTime: 0,
        lostDeals: lost,
        wonDeals: won,
        clientsServed: uniqueClients,
        ranking: 0,
        monthlyTarget: target,
        targetPct: target > 0 ? (total / target) * 100 : 0,
      };
    });

    performances.sort((a, b) => b.totalSales - a.totalSales);
    performances.forEach((p, i) => { p.ranking = i + 1; });

    return performances;
  }, [reps, orders, funnel]);
}
