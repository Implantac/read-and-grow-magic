import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { formatBRL } from '@/lib/formatters';
import {
  DollarSign, ShoppingCart, Users, TrendingUp, Clock, CheckCircle,
  ArrowUpRight, BarChart3, ShieldAlert, UserX,
} from 'lucide-react';
import { useOrders } from '@/hooks/commercial/useOrders';
import { useClients } from '@/hooks/commercial/useClients';
import { useSalesFunnel } from '@/hooks/commercial/useSalesFunnel';
import { useSalesReps } from '@/hooks/commercial/useSalesReps';
import { useCommercialAlerts } from '@/hooks/commercial/useCommercialAlerts';
import { useSales } from '@/hooks/commercial/useSales';
import { useCommercialInsights } from '@/hooks/commercial/useCommercialRules';
import { useAIDailyActions, useAIRecommendations, useRunAIEngine } from '@/hooks/commercial/useAICommercial';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Skeleton } from '@/ui/base/skeleton';
import { CanalFilter } from '@/components/shared/CanalFilter';
import { useCommercialStats, fmtShort, CHART_COLORS } from './dashboard/useCommercialStats';
import { CommercialMetricsRow } from './dashboard/CommercialMetricsRow';
import { TopRepsCard, TopRegionsCard, AlertsInsightsCard } from './dashboard/BottomCards';
import { AIInsightsPanel } from './dashboard/AIInsightsPanel';

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

  const stats = useCommercialStats(orders, clients, funnel, reps, alerts, sales);

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
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <PageHeader title="Dashboard Comercial" description="Centro de inteligência e performance de vendas" />
        <CanalFilter />
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /> Varejo (PDV)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatBRL(stats.varejoBilling)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.varejoOrders} pedidos no mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Atacado / Indústria</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-accent">{formatBRL(stats.atacadoBilling)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stats.atacadoOrders} pedidos no mês</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <KPICard index={0} title="Faturamento Hoje" value={formatBRL(stats.billingToday)} subtitle={`${stats.ordersToday} pedidos`} icon={<ShoppingCart className="h-5 w-5" />} accentColor="primary" />
        <KPICard index={1} title="Faturamento do Mês" value={formatBRL(stats.billingMonth)} subtitle={
          stats.billingGrowth !== 0
            ? `${stats.billingGrowth > 0 ? '↑' : '↓'} ${Math.abs(stats.billingGrowth).toFixed(1)}% vs mês anterior`
            : `${stats.ordersMonth} pedidos`
        } icon={<DollarSign className="h-5 w-5" />} accentColor="success" />
        <KPICard index={2} title="Ticket Médio" value={formatBRL(stats.avgTicket)} subtitle={`${stats.ordersMonth} pedidos no mês`} icon={<TrendingUp className="h-5 w-5" />} accentColor="accent" />
        <KPICard index={3} title="Taxa de Conversão" value={`${stats.conversionRate.toFixed(1)}%`} subtitle={`${stats.funnelOpen} oportunidades abertas`} icon={<CheckCircle className="h-5 w-5" />} accentColor="info" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <KPICard index={4} title="Pedidos Atrasados" value={stats.overdueOrders.toString()} icon={<Clock className="h-5 w-5" />} accentColor="danger" />
        <KPICard index={5} title="Aprovações Pendentes" value={insights.pendingApprovals.length.toString()} icon={<ShieldAlert className="h-5 w-5" />} accentColor="warning" />
        <KPICard index={6} title="Pipeline Aberto" value={fmtShort(stats.funnelValue)} subtitle={`${stats.funnelOpen} oportunidades`} icon={<ArrowUpRight className="h-5 w-5" />} accentColor="info" />
        <KPICard index={7} title="Clientes Ativos" value={stats.activeClients.toString()} subtitle={`${stats.inactiveClients} inativos • ${stats.blockedClients} bloqueados`} icon={<Users className="h-5 w-5" />} accentColor="success" />
        <KPICard index={8} title="Sem Representante" value={stats.noRepClients.toString()} icon={<UserX className="h-5 w-5" />} accentColor="danger" />
      </div>

      <CommercialMetricsRow stats={stats} insights={insights} clientsLen={clients.length} />

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

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Pedidos por Status</CardTitle></CardHeader>
          <CardContent>
            {stats.statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats.statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {stats.statusChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (<p className="text-center text-muted-foreground py-10">Sem dados</p>)}
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
            ) : (<p className="text-center text-muted-foreground py-10">Sem dados</p>)}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <TopRepsCard topReps={stats.topReps} />
        <TopRegionsCard regions={insights.topRegions} />
        <AlertsInsightsCard stuckOrders={insights.stuckOrders} alerts={alerts} openAlerts={stats.openAlerts} />
      </div>

      <AIInsightsPanel aiActions={aiActions} aiRecs={aiRecs} onRefresh={() => runAIEngine.mutate('full_analysis')} isRefreshing={runAIEngine.isPending} />
    </PageContainer>
  );
}
