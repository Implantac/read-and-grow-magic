import { useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign, ShoppingCart, Users, TrendingUp, AlertTriangle, Target,
  ArrowUpRight, Clock, CheckCircle,
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useClients } from '@/hooks/useClients';
import { useSalesFunnel } from '@/hooks/useSalesFunnel';
import { useSalesReps } from '@/hooks/useSalesReps';
import { useCommercialAlerts } from '@/hooks/useCommercialAlerts';
import { useSales } from '@/hooks/useSales';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { startOfMonth, endOfMonth, isToday, subDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#64748b', '#0ea5e9', '#f59e0b'];

export default function CommercialDashboard() {
  const { data: orders = [], isLoading: lo } = useOrders();
  const { data: clients = [], isLoading: lc } = useClients();
  const { data: funnel = [], isLoading: lf } = useSalesFunnel();
  const { data: reps = [] } = useSalesReps();
  const { data: alerts = [] } = useCommercialAlerts('open');
  const { data: sales = [] } = useSales();

  const loading = lo || lc || lf;

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const ordersToday = orders.filter(o => isToday(new Date(o.date)));
    const ordersMonth = orders.filter(o => {
      const d = new Date(o.date);
      return d >= monthStart && d <= monthEnd;
    });
    const billingMonth = ordersMonth.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const avgTicket = ordersMonth.length > 0 ? billingMonth / ordersMonth.length : 0;

    const byStatus = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusChartData = Object.entries(byStatus).map(([name, value]) => ({ name: getStatusLabel(name), value }));

    const overdueOrders = orders.filter(o =>
      o.delivery_date && new Date(o.delivery_date) < now && !['delivered', 'cancelled'].includes(o.status)
    );

    const inactiveClients = clients.filter(c => {
      const lp = (c as any).last_purchase_date;
      return !lp || new Date(lp) < subDays(now, 90);
    });

    const clientTotals: Record<string, { name: string; total: number }> = {};
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      if (!clientTotals[o.client_name]) clientTotals[o.client_name] = { name: o.client_name, total: 0 };
      clientTotals[o.client_name].total += o.total;
    });
    const topClients = Object.values(clientTotals).sort((a, b) => b.total - a.total).slice(0, 5);

    const repTotals: Record<string, { name: string; total: number }> = {};
    orders.filter(o => o.status !== 'cancelled' && o.sales_rep_name).forEach(o => {
      const rn = o.sales_rep_name!;
      if (!repTotals[rn]) repTotals[rn] = { name: rn, total: 0 };
      repTotals[rn].total += o.total;
    });
    const topReps = Object.values(repTotals).sort((a, b) => b.total - a.total).slice(0, 5);

    const funnelOpen = funnel.filter(f => f.status === 'open');
    const funnelValue = funnelOpen.reduce((s, f) => s + f.value, 0);
    const conversionRate = funnel.length > 0
      ? ((funnel.filter(f => f.status === 'won').length / funnel.length) * 100)
      : 0;

    return {
      ordersToday: ordersToday.length,
      ordersMonth: ordersMonth.length,
      billingMonth,
      avgTicket,
      statusChartData,
      overdueOrders: overdueOrders.length,
      inactiveClients: inactiveClients.length,
      topClients,
      topReps,
      funnelOpen: funnelOpen.length,
      funnelValue,
      conversionRate,
      openAlerts: alerts.length,
    };
  }, [orders, clients, funnel, alerts, sales]);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard Comercial" description="Visão geral do desempenho comercial" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Dashboard Comercial" description="Centro de inteligência e performance de vendas" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 mt-6">
        <KPICard index={0} title="Pedidos Hoje" value={stats.ordersToday.toString()} icon={<ShoppingCart className="h-5 w-5" />} accentColor="primary" />
        <KPICard index={1} title="Pedidos do Mês" value={stats.ordersMonth.toString()} icon={<Target className="h-5 w-5" />} accentColor="info" />
        <KPICard index={2} title="Faturamento do Mês" value={fmt(stats.billingMonth)} icon={<DollarSign className="h-5 w-5" />} accentColor="success" />
        <KPICard index={3} title="Ticket Médio" value={fmt(stats.avgTicket)} icon={<TrendingUp className="h-5 w-5" />} accentColor="accent" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <KPICard index={4} title="Pedidos Atrasados" value={stats.overdueOrders.toString()} icon={<Clock className="h-5 w-5" />} accentColor="danger" />
        <KPICard index={5} title="Clientes Inativos" value={stats.inactiveClients.toString()} icon={<Users className="h-5 w-5" />} accentColor="warning" />
        <KPICard index={6} title="Oportunidades Abertas" value={`${stats.funnelOpen} (${fmt(stats.funnelValue)})`} icon={<ArrowUpRight className="h-5 w-5" />} accentColor="info" />
        <KPICard index={7} title="Taxa de Conversão" value={`${stats.conversionRate.toFixed(1)}%`} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Pedidos por Status</CardTitle></CardHeader>
          <CardContent>
            {stats.statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats.statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {stats.statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Top 5 Clientes</CardTitle></CardHeader>
          <CardContent>
            {stats.topClients.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.topClients} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => fmt(v)} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={120} fontSize={11} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Top Representantes</CardTitle></CardHeader>
          <CardContent>
            {stats.topReps.length > 0 ? (
              <div className="space-y-3">
                {stats.topReps.map((rep, i) => (
                  <div key={rep.name} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold">
                        {i + 1}
                      </Badge>
                      <span className="text-sm font-medium">{rep.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{fmt(rep.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertas Comerciais ({stats.openAlerts})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3 max-h-[260px] overflow-y-auto">
                {alerts.slice(0, 8).map(a => (
                  <div key={a.id} className="flex items-start gap-3 border-b pb-2 last:border-0">
                    <Badge variant={a.severity === 'high' ? 'destructive' : 'default'} className="mt-0.5 text-[10px]">
                      {a.severity === 'high' ? 'Alta' : a.severity === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{a.title}</p>
                      {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">Nenhum alerta aberto</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendente', confirmed: 'Confirmado', processing: 'Processando',
    separated: 'Separado', invoiced: 'Faturado', shipped: 'Enviado',
    delivered: 'Entregue', cancelled: 'Cancelado',
  };
  return map[status] || status;
}
