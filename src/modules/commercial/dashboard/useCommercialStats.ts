import { useMemo } from 'react';
import { startOfMonth, endOfMonth, isToday, subMonths, format, startOfDay, eachDayOfInterval, subDays } from 'date-fns';

export function useCommercialStats(orders: any[], clients: any[], funnel: any[], reps: any[], alerts: any[], sales: any[]) {
  return useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const ordersToday = orders.filter(o => isToday(new Date(o.date)));
    const billingToday = ordersToday.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const ordersMonth = orders.filter(o => {
      const d = new Date(o.date);
      return d >= monthStart && d <= monthEnd;
    });
    const billingMonth = ordersMonth.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const avgTicket = ordersMonth.length > 0 ? billingMonth / ordersMonth.length : 0;

    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));
    const prevMonthOrders = orders.filter(o => {
      const d = new Date(o.date);
      return d >= prevMonthStart && d <= prevMonthEnd && o.status !== 'cancelled';
    });
    const prevBilling = prevMonthOrders.reduce((s, o) => s + o.total, 0);
    const billingGrowth = prevBilling > 0 ? ((billingMonth - prevBilling) / prevBilling) * 100 : 0;

    const byStatus = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const statusChartData = Object.entries(byStatus).map(([name, value]) => ({ name: getStatusLabel(name), value }));

    const overdueOrders = orders.filter(o =>
      o.delivery_date && new Date(o.delivery_date) < now && !['delivered', 'cancelled'].includes(o.status)
    );

    const clientTotals: Record<string, { name: string; total: number; orders: number }> = {};
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      if (!clientTotals[o.client_name]) clientTotals[o.client_name] = { name: o.client_name, total: 0, orders: 0 };
      clientTotals[o.client_name].total += o.total;
      clientTotals[o.client_name].orders++;
    });
    const topClients = Object.values(clientTotals).sort((a, b) => b.total - a.total).slice(0, 5);

    const repTotals: Record<string, { name: string; total: number; target: number; orders: number }> = {};
    orders.filter(o => o.status !== 'cancelled' && o.sales_rep_name).forEach(o => {
      const rn = o.sales_rep_name!;
      if (!repTotals[rn]) {
        const rep = reps.find(r => r.name === rn);
        repTotals[rn] = { name: rn, total: 0, target: rep?.monthly_target || 0, orders: 0 };
      }
      repTotals[rn].total += o.total;
      repTotals[rn].orders++;
    });
    const topReps = Object.values(repTotals).sort((a, b) => b.total - a.total).slice(0, 5);

    const totalTarget = reps.reduce((s, r) => s + (r.monthly_target || 0), 0);
    const targetPct = totalTarget > 0 ? (billingMonth / totalTarget) * 100 : 0;

    const funnelOpen = funnel.filter(f => f.status === 'open');
    const funnelValue = funnelOpen.reduce((s, f) => s + f.value, 0);
    const conversionRate = funnel.length > 0
      ? ((funnel.filter(f => f.status === 'won').length / funnel.length) * 100)
      : 0;

    const days30 = eachDayOfInterval({ start: subDays(now, 29), end: now });
    const dailyTrend = days30.map(day => {
      const dayStr = format(day, 'dd/MM');
      const dayOrders = orders.filter(o => {
        const d = startOfDay(new Date(o.date));
        return d.getTime() === startOfDay(day).getTime() && o.status !== 'cancelled';
      });
      return { day: dayStr, valor: dayOrders.reduce((s, o) => s + o.total, 0), pedidos: dayOrders.length };
    });

    const activeClients = clients.filter(c => c.status === 'active').length;
    const inactiveClients = clients.filter(c => c.status === 'inactive').length;
    const blockedClients = clients.filter(c => c.status === 'blocked').length;
    const noRepClients = clients.filter(c => !c.sales_rep_id).length;

    const varejoOrders = ordersMonth.filter((o: any) => o.canal_operacional === 'VAREJO_PDV' && o.status !== 'cancelled');
    const atacadoOrders = ordersMonth.filter((o: any) => o.canal_operacional === 'ATACADO_INDUSTRIA' && o.status !== 'cancelled');
    const varejoBilling = varejoOrders.reduce((s, o) => s + o.total, 0);
    const atacadoBilling = atacadoOrders.reduce((s, o) => s + o.total, 0);

    return {
      ordersToday: ordersToday.length, billingToday,
      ordersMonth: ordersMonth.length, billingMonth,
      avgTicket, billingGrowth, statusChartData,
      overdueOrders: overdueOrders.length,
      topClients, topReps,
      funnelOpen: funnelOpen.length, funnelValue, conversionRate,
      openAlerts: alerts.length, totalTarget, targetPct,
      dailyTrend, activeClients, inactiveClients, blockedClients, noRepClients,
      varejoBilling, atacadoBilling,
      varejoOrders: varejoOrders.length, atacadoOrders: atacadoOrders.length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, clients, funnel, alerts, sales, reps]);
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendente', confirmed: 'Confirmado', processing: 'Processando',
    separated: 'Separado', invoiced: 'Faturado', shipped: 'Enviado',
    delivered: 'Entregue', cancelled: 'Cancelado',
  };
  return map[status] || status;
}

export const fmtShort = (v: number) => {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};

export const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#64748b', '#0ea5e9', '#f59e0b'];
