import { useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBRL } from '@/lib/formatters';
import {
  DollarSign, ShoppingCart, Users, TrendingUp, AlertTriangle, Target,
  ArrowUpRight, Clock, CheckCircle, MapPin, Zap, BarChart3, ShieldAlert,
  UserX, TrendingDown, Brain, Sparkles, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/hooks/useOrders';
import { useClients } from '@/hooks/useClients';
import { useSalesFunnel } from '@/hooks/useSalesFunnel';
import { useSalesReps } from '@/hooks/useSalesReps';
import { useCommercialAlerts } from '@/hooks/useCommercialAlerts';
import { useSales } from '@/hooks/useSales';
import { useCommercialInsights } from '@/hooks/useCommercialRules';
import { useAIDailyActions, useAIRecommendations, useRunAIEngine } from '@/hooks/useAICommercial';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { startOfMonth, endOfMonth, isToday, differenceInDays, subMonths, format, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const fmtShort = (v: number) => {
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
  return formatBRL(v);
};
const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#64748b', '#0ea5e9', '#f59e0b'];

export default function CommercialDashboard() {
  const { data: orders = [], isLoading: lo } = useOrders();
  const { data: clients = [], isLoading: lc } = useClients();
  const { data: funnel = [], isLoading: lf } = useSalesFunnel();
  const { data: reps = [] } = useSalesReps();
  const { data: alerts = [] } = useCommercialAlerts('open');
  const { data: sales = [] } = useSales();

  const insights = useCommercialInsights(clients, orders);
  const { data: aiActions = [] } = useAIDailyActions();
  const { data: aiRecs = [] } = useAIRecommendations('pending');
  const runAIEngine = useRunAIEngine();
  const loading = lo || lc || lf;

  const stats = useMemo(() => {
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

    // Previous month comparison
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

    // Daily billing trend (last 30 days)
    const days30 = eachDayOfInterval({ start: subDays(now, 29), end: now });
    const dailyTrend = days30.map(day => {
      const dayStr = format(day, 'dd/MM');
      const dayOrders = orders.filter(o => {
        const d = startOfDay(new Date(o.date));
        return d.getTime() === startOfDay(day).getTime() && o.status !== 'cancelled';
      });
      return { day: dayStr, valor: dayOrders.reduce((s, o) => s + o.total, 0), pedidos: dayOrders.length };
    });

    // Active vs inactive clients
    const activeClients = clients.filter(c => c.status === 'active').length;
    const inactiveClients = clients.filter(c => c.status === 'inactive').length;
    const blockedClients = clients.filter(c => c.status === 'blocked').length;

    // Clients without rep
    const noRepClients = clients.filter(c => !c.sales_rep_id).length;

    return {
      ordersToday: ordersToday.length,
      billingToday,
      ordersMonth: ordersMonth.length,
      billingMonth,
      avgTicket,
      billingGrowth,
      statusChartData,
      overdueOrders: overdueOrders.length,
      topClients,
      topReps,
      funnelOpen: funnelOpen.length,
      funnelValue,
      conversionRate,
      openAlerts: alerts.length,
      totalTarget,
      targetPct,
      dailyTrend,
      activeClients,
      inactiveClients,
      blockedClients,
      noRepClients,
    };
  }, [orders, clients, funnel, alerts, sales, reps]);

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

      {/* KPIs Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 mt-6">
        <KPICard index={0} title="Faturamento Hoje" value={formatBRL(stats.billingToday)} subtitle={`${stats.ordersToday} pedidos`} icon={<ShoppingCart className="h-5 w-5" />} accentColor="primary" />
        <KPICard index={1} title="Faturamento do Mês" value={formatBRL(stats.billingMonth)} subtitle={
          stats.billingGrowth !== 0
            ? `${stats.billingGrowth > 0 ? '↑' : '↓'} ${Math.abs(stats.billingGrowth).toFixed(1)}% vs mês anterior`
            : `${stats.ordersMonth} pedidos`
        } icon={<DollarSign className="h-5 w-5" />} accentColor="success" />
        <KPICard index={2} title="Ticket Médio" value={formatBRL(stats.avgTicket)} subtitle={`${stats.ordersMonth} pedidos no mês`} icon={<TrendingUp className="h-5 w-5" />} accentColor="accent" />
        <KPICard index={3} title="Taxa de Conversão" value={`${stats.conversionRate.toFixed(1)}%`} subtitle={`${stats.funnelOpen} oportunidades abertas`} icon={<CheckCircle className="h-5 w-5" />} accentColor="info" />
      </div>

      {/* KPIs Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <KPICard index={4} title="Pedidos Atrasados" value={stats.overdueOrders.toString()} icon={<Clock className="h-5 w-5" />} accentColor="danger" />
        <KPICard index={5} title="Aprovações Pendentes" value={insights.pendingApprovals.length.toString()} icon={<ShieldAlert className="h-5 w-5" />} accentColor="warning" />
        <KPICard index={6} title="Pipeline Aberto" value={fmtShort(stats.funnelValue)} subtitle={`${stats.funnelOpen} oportunidades`} icon={<ArrowUpRight className="h-5 w-5" />} accentColor="info" />
        <KPICard index={7} title="Clientes Ativos" value={stats.activeClients.toString()} subtitle={`${stats.inactiveClients} inativos • ${stats.blockedClients} bloqueados`} icon={<Users className="h-5 w-5" />} accentColor="success" />
        <KPICard index={8} title="Sem Representante" value={stats.noRepClients.toString()} icon={<UserX className="h-5 w-5" />} accentColor="danger" />
      </div>

      {/* Meta vs Realizado + Previsão + ABC */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Meta vs Realizado</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{formatBRL(stats.billingMonth)}</p>
                <p className="text-xs text-muted-foreground">de {formatBRL(stats.totalTarget)} meta mensal</p>
              </div>
              <Badge variant={stats.targetPct >= 100 ? 'default' : stats.targetPct >= 70 ? 'secondary' : 'destructive'} className="text-sm">
                {stats.targetPct.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={Math.min(stats.targetPct, 100)} className="h-2" />
            {stats.billingGrowth !== 0 && (
              <div className="flex items-center gap-1 text-xs">
                {stats.billingGrowth > 0 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                <span className={stats.billingGrowth > 0 ? 'text-emerald-600' : 'text-destructive'}>
                  {Math.abs(stats.billingGrowth).toFixed(1)}% vs mês anterior
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Previsão de Faturamento</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatBRL(insights.revenueForecast)}</p>
            <p className="text-xs text-muted-foreground mt-1">Pedidos em andamento (pendentes → separados)</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[10px]">{insights.stuckOrders.length} travados</Badge>
              <Badge variant="outline" className="text-[10px]">{insights.inactiveClients.length} sem compra há 90d+</Badge>
              <Badge variant="outline" className="text-[10px]">{insights.pendingApprovals.length} aguardando aprovação</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Curva ABC Clientes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(['A', 'B', 'C'] as const).map(cls => {
                const count = insights.abcDist[cls];
                const pct = clients.length > 0 ? (count / clients.length) * 100 : 0;
                return (
                  <div key={cls} className="flex items-center gap-3">
                    <Badge variant={cls === 'A' ? 'default' : 'secondary'} className="w-8 justify-center text-xs font-bold">{cls}</Badge>
                    <div className="flex-1">
                      <Progress value={pct} className="h-1.5" />
                    </div>
                    <span className="text-xs font-medium w-16 text-right">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Trend Chart */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm font-medium">Evolução de Faturamento (últimos 30 dias)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="day" fontSize={10} interval={4} />
              <YAxis tickFormatter={v => fmtShort(v)} fontSize={10} />
              <Tooltip formatter={(v: number, name: string) => [name === 'valor' ? formatBRL(v) : v, name === 'valor' ? 'Faturamento' : 'Pedidos']} />
              <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="valor" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row */}
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
                  <XAxis type="number" tickFormatter={(v) => fmtShort(v)} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={120} fontSize={11} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Top Representantes</CardTitle></CardHeader>
          <CardContent>
            {stats.topReps.length > 0 ? (
              <div className="space-y-3">
                {stats.topReps.map((rep, i) => {
                  const pct = rep.target > 0 ? (rep.total / rep.target) * 100 : 0;
                  return (
                    <div key={rep.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold">{i + 1}</Badge>
                          <div>
                            <span className="text-sm font-medium truncate">{rep.name}</span>
                            <p className="text-[10px] text-muted-foreground">{rep.orders} pedidos</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-primary">{formatBRL(rep.total)}</span>
                      </div>
                      {rep.target > 0 && (
                        <div className="flex items-center gap-2 pl-8">
                          <Progress value={Math.min(pct, 100)} className="h-1 flex-1" />
                          <span className="text-[10px] text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">Sem dados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4" /> Top Regiões</CardTitle></CardHeader>
          <CardContent>
            {insights.topRegions.length > 0 ? (
              <div className="space-y-3">
                {insights.topRegions.map((region, i) => (
                  <div key={region.name} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold">{i + 1}</Badge>
                      <div>
                        <span className="text-sm font-medium">{region.name}</span>
                        <p className="text-[10px] text-muted-foreground">{region.count} pedidos</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary">{formatBRL(region.total)}</span>
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
              Alertas e Insights ({stats.openAlerts + insights.stuckOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {insights.stuckOrders.slice(0, 3).map(o => (
                <div key={o.id} className="flex items-start gap-3 border-b pb-2">
                  <Badge variant="destructive" className="mt-0.5 text-[10px]">Travado</Badge>
                  <div>
                    <p className="text-sm font-medium">Pedido {o.number}</p>
                    <p className="text-xs text-muted-foreground">{o.client_name} • pendente há {differenceInDays(new Date(), new Date(o.created_at))} dias</p>
                  </div>
                </div>
              ))}
              {alerts.slice(0, 5).map(a => (
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
              {alerts.length === 0 && insights.stuckOrders.length === 0 && (
                <p className="text-center text-muted-foreground py-10">Nenhum alerta</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Panel */}
      {(aiActions.length > 0 || aiRecs.length > 0) && (
        <Card className="mt-6 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Inteligência Artificial — Resumo do Dia
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => runAIEngine.mutate('full_analysis')} disabled={runAIEngine.isPending}>
                <RefreshCw className={`h-3 w-3 mr-1 ${runAIEngine.isPending ? 'animate-spin' : ''}`} /> Atualizar IA
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {aiActions.filter(a => a.status === 'pending').slice(0, 4).map(action => (
                <div key={action.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                    {action.estimated_value > 0 && (
                      <Badge variant="secondary" className="mt-1 text-[10px]">{formatBRL(action.estimated_value)}</Badge>
                    )}
                  </div>
                </div>
              ))}
              {aiRecs.slice(0, 4).map(rec => (
                <div key={rec.id} className="flex items-start gap-3 p-3 rounded-lg border bg-primary/5">
                  <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{rec.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                    {rec.estimated_value > 0 && (
                      <Badge variant="secondary" className="mt-1 text-[10px]">{formatBRL(rec.estimated_value)}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
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
