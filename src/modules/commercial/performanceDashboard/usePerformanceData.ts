import { useMemo } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useOrders } from '@/hooks/commercial/useOrders';
import { useClients } from '@/hooks/commercial/useClients';
import { useSalesFunnel } from '@/hooks/commercial/useSalesFunnel';
import { useSalesReps } from '@/hooks/commercial/useSalesReps';
import { useSales } from '@/hooks/commercial/useSales';
import { useRepPerformance, useLostSalesAlerts, useClientInsights, useFollowUps } from '@/hooks/commercial/useSalesIntelligence';
import { FUNNEL_STAGES, FUNNEL_LABELS } from './constants';

export function usePerformanceData() {
  const { data: orders = [], isLoading: lo } = useOrders();
  const { data: clients = [] } = useClients();
  const { data: funnel = [], isLoading: lf } = useSalesFunnel();
  const { data: reps = [] } = useSalesReps();
  const { data: sales = [] } = useSales() as { data: any[] | undefined };
  const { data: followUps = [] } = useFollowUps();

  const performances = useRepPerformance(reps, orders, funnel);
  const lostAlerts = useLostSalesAlerts(funnel, orders, followUps);
  const insights = useClientInsights(clients, orders, sales);
  const loading = lo || lf;

  const globalStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthOrders = orders.filter(o => {
      const d = new Date(o.date);
      return d >= monthStart && d <= monthEnd && o.status !== 'cancelled';
    });
    const monthBilling = monthOrders.reduce((s, o) => s + o.total, 0);
    const avgTicket = monthOrders.length > 0 ? monthBilling / monthOrders.length : 0;
    const totalTarget = reps.reduce((s, r) => s + (r.monthly_target || 0), 0);
    const wonDeals = funnel.filter(f => f.status === 'won').length;
    const lostDeals = funnel.filter(f => f.status === 'lost').length;
    const conversionRate = (wonDeals + lostDeals) > 0 ? (wonDeals / (wonDeals + lostDeals)) * 100 : 0;
    const lostValue = lostAlerts.reduce((s, a) => s + a.estimatedLoss, 0);
    const atRiskClients = insights.filter(i => i.riskLevel === 'critical' || i.riskLevel === 'high').length;
    return { monthBilling, avgTicket, totalTarget, conversionRate, wonDeals, lostDeals, lostValue, atRiskClients, monthOrders: monthOrders.length };
  }, [orders, reps, funnel, lostAlerts, insights]);

  const funnelConversion = useMemo(() => {
    return FUNNEL_STAGES.map((stage, idx) => {
      const inOrPast = funnel.filter(f => {
        const fIdx = FUNNEL_STAGES.indexOf(f.stage);
        return fIdx >= idx || f.status === 'won';
      }).length;
      const pastThis = funnel.filter(f => {
        const fIdx = FUNNEL_STAGES.indexOf(f.stage);
        return fIdx > idx || f.status === 'won';
      }).length;
      const rate = inOrPast > 0 ? (pastThis / inOrPast) * 100 : 0;
      return { name: FUNNEL_LABELS[stage], total: inOrPast, passed: pastThis, rate: Math.round(rate), dropoff: Math.round(100 - rate) };
    });
  }, [funnel]);

  return { loading, performances, lostAlerts, globalStats, funnelConversion };
}
