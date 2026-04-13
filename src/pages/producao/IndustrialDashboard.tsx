import { useMemo, useEffect, useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useProductCosts } from '@/hooks/useProductCosts';
import { useSupplyStock } from '@/hooks/useSupplyStock';
import { useIndustrialAlerts } from '@/hooks/useIndustrialAlerts';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useProductionCapacity } from '@/hooks/useProductionCapacity';
import { KPICard } from '@/components/shared/KPICard';
import { DollarSign, TrendingUp, AlertTriangle, Factory, Package, Gauge, CheckCircle, XCircle, Clock, Users, Activity, Zap, Layers, Timer, Wrench, Radio, Brain, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { differenceInDays, differenceInMinutes, format, parseISO, subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

export default function IndustrialDashboard() {
  const { costs, avgMargin, totalRevenue, totalCostSum, lowMarginProducts, highCostProducts } = useProductCosts();
  const { supplies, lowStockItems } = useSupplyStock();
  const { activeAlerts, resolveAlert } = useIndustrialAlerts();
  const { orders: productionOrders, refetch: refetchOrders } = useProductionOrders();
  const { entries, refetch: refetchEntries } = useTimeEntries();
  const { capacities } = useProductionCapacity();
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchOrders();
      refetchEntries();
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchOrders, refetchEntries]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('industrial-dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_orders' }, () => { refetchOrders(); setLastRefresh(new Date()); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, () => { refetchEntries(); setLastRefresh(new Date()); })
      .subscribe((status) => { setRealtimeActive(status === 'SUBSCRIBED'); });
    return () => { supabase.removeChannel(channel); };
  }, [refetchOrders, refetchEntries]);

  // === PRODUCTION KPIs ===
  const totalOPs = productionOrders.length;
  const completedOPs = productionOrders.filter(o => o.status === 'completed').length;
  const inProgressOPs = productionOrders.filter(o => o.status === 'in_progress').length;
  const plannedOPs = productionOrders.filter(o => o.status === 'planned').length;
  const pausedOPs = productionOrders.filter(o => o.status === 'paused').length;
  const lateOPs = productionOrders.filter(o => o.due_date && differenceInDays(new Date(), parseISO(o.due_date)) > 0 && !['completed', 'cancelled'].includes(o.status)).length;

  // WIP (Work In Progress) - sum of pending quantities on active OPs
  const wipUnits = productionOrders
    .filter(o => o.status === 'in_progress' || o.status === 'paused')
    .reduce((s, o) => s + Math.max(0, o.quantity - o.produced_quantity), 0);

  // On-time delivery rate
  const completedWithDates = productionOrders.filter(o => o.status === 'completed' && o.completed_date && o.due_date);
  const onTimeCount = completedWithDates.filter(o => new Date(o.completed_date!) <= new Date(o.due_date!)).length;
  const onTimePct = completedWithDates.length > 0 ? (onTimeCount / completedWithDates.length) * 100 : 0;

  // OEE approximation (availability * performance * quality)
  const totalEstimated = productionOrders.reduce((s, o) => s + o.estimated_time_minutes, 0);
  const totalRealized = productionOrders.reduce((s, o) => s + o.realized_time_minutes, 0);
  const totalProduced = productionOrders.reduce((s, o) => s + o.produced_quantity, 0);
  const totalTarget = productionOrders.filter(o => ['completed', 'in_progress'].includes(o.status)).reduce((s, o) => s + o.quantity, 0);
  const totalRejected = productionOrders.reduce((s, o) => s + o.rejected_quantity, 0);
  const availability = totalEstimated > 0 ? Math.min((totalRealized / totalEstimated), 1) : 0;
  const performance = totalTarget > 0 ? Math.min((totalProduced / totalTarget), 1) : 0;
  const quality = totalProduced > 0 ? ((totalProduced - totalRejected) / totalProduced) : 1;
  const oee = (availability * performance * quality) * 100;

  // Average lead time (days from start to completion)
  const avgLeadTime = useMemo(() => {
    const completed = productionOrders.filter(o => o.start_date && o.completed_date);
    if (completed.length === 0) return 0;
    const totalDays = completed.reduce((s, o) => s + differenceInDays(new Date(o.completed_date!), new Date(o.start_date!)), 0);
    return totalDays / completed.length;
  }, [productionOrders]);

  // MTTR (Mean Time To Repair) - average paused time of completed entries
  const mttr = useMemo(() => {
    const withPause = entries.filter(e => e.status === 'completed' && e.paused_time > 0);
    if (withPause.length === 0) return 0;
    return withPause.reduce((s, e) => s + e.paused_time, 0) / withPause.length;
  }, [entries]);

  // Average cycle time per piece (minutes)
  const avgCycleTime = useMemo(() => {
    const completedEntries = entries.filter(e => e.status === 'completed' && e.end_time && e.produced_quantity > 0);
    if (completedEntries.length === 0) return 0;
    const totalMin = completedEntries.reduce((s, e) => {
      const elapsed = differenceInMinutes(new Date(e.end_time!), new Date(e.start_time)) - (e.paused_time || 0);
      return s + Math.max(0, elapsed);
    }, 0);
    const totalPcs = completedEntries.reduce((s, e) => s + e.produced_quantity, 0);
    return totalPcs > 0 ? totalMin / totalPcs : 0;
  }, [entries]);

  // Capacity utilization
  const avgCapLoad = capacities.length > 0 
    ? capacities.filter(c => c.is_active).reduce((s, c) => s + c.current_load_pct, 0) / capacities.filter(c => c.is_active).length 
    : 0;

  // Throughput trend (last 14 days)
  const throughputTrend = useMemo(() => {
    const days: { date: string; completed: number; produced: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dayStr = format(d, 'yyyy-MM-dd');
      const label = format(d, 'dd/MM');
      const dayCompleted = productionOrders.filter(o => o.completed_date && format(parseISO(o.completed_date), 'yyyy-MM-dd') === dayStr).length;
      const dayProduced = productionOrders.filter(o => o.completed_date && format(parseISO(o.completed_date), 'yyyy-MM-dd') === dayStr).reduce((s, o) => s + o.produced_quantity, 0);
      days.push({ date: label, completed: dayCompleted, produced: dayProduced });
    }
    return days;
  }, [productionOrders]);

  // Efficiency by sector
  const sectorEfficiency = useMemo(() => {
    const sectors = [...new Set(productionOrders.map(o => o.sector || o.work_center).filter(Boolean))];
    return sectors.map(sector => {
      const sOPs = productionOrders.filter(o => (o.sector || o.work_center) === sector);
      const sCompleted = sOPs.filter(o => o.status === 'completed').length;
      const sTotal = sOPs.length;
      const sProduced = sOPs.reduce((s, o) => s + o.produced_quantity, 0);
      const sRejected = sOPs.reduce((s, o) => s + o.rejected_quantity, 0);
      const sQuality = sProduced > 0 ? ((sProduced - sRejected) / sProduced) * 100 : 100;
      const sWIP = sOPs.filter(o => ['in_progress', 'paused'].includes(o.status)).reduce((s, o) => s + Math.max(0, o.quantity - o.produced_quantity), 0);
      return { sector: sector!, ops: sTotal, completed: sCompleted, efficiency: sTotal > 0 ? (sCompleted / sTotal) * 100 : 0, quality: sQuality, produced: sProduced, wip: sWIP };
    }).sort((a, b) => b.ops - a.ops);
  }, [productionOrders]);

  // OP status distribution
  const statusDistribution = [
    { name: 'Planejadas', value: plannedOPs, color: 'hsl(var(--info))' },
    { name: 'Em Produção', value: inProgressOPs, color: 'hsl(var(--primary))' },
    { name: 'Pausadas', value: pausedOPs, color: 'hsl(var(--warning))' },
    { name: 'Concluídas', value: completedOPs, color: 'hsl(var(--success, 142 71% 45%))' },
  ].filter(d => d.value > 0);

  // === DELAY PREDICTION ENGINE ===
  const delayPredictions = useMemo(() => {
    return productionOrders
      .filter(o => ['in_progress', 'planned'].includes(o.status) && o.due_date)
      .map(order => {
        const daysLeft = differenceInDays(parseISO(order.due_date!), new Date());
        const progressPct = order.quantity > 0 ? (order.produced_quantity / order.quantity) * 100 : 0;
        const estimatedVsRealized = order.estimated_time_minutes > 0
          ? (order.realized_time_minutes / order.estimated_time_minutes) * 100
          : 0;

        // Simple prediction: if realized time already exceeds 80% of estimated and progress < 50%, high risk
        let risk: 'low' | 'medium' | 'high' | 'critical' = 'low';
        let reason = '';
        if (daysLeft < 0) {
          risk = 'critical';
          reason = `Atrasada ${Math.abs(daysLeft)} dias`;
        } else if (daysLeft <= 1 && progressPct < 70) {
          risk = 'critical';
          reason = `Prazo amanhã e apenas ${progressPct.toFixed(0)}% concluído`;
        } else if (estimatedVsRealized > 80 && progressPct < 50) {
          risk = 'high';
          reason = `Consumiu ${estimatedVsRealized.toFixed(0)}% do tempo com ${progressPct.toFixed(0)}% produzido`;
        } else if (daysLeft <= 3 && progressPct < 50) {
          risk = 'high';
          reason = `${daysLeft}d restantes e ${progressPct.toFixed(0)}% concluído`;
        } else if (daysLeft <= 5 && progressPct < 30) {
          risk = 'medium';
          reason = `${daysLeft}d restantes e ${progressPct.toFixed(0)}% concluído`;
        }

        return { order, daysLeft, progressPct, risk, reason };
      })
      .filter(p => p.risk !== 'low')
      .sort((a, b) => {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return riskOrder[a.risk] - riskOrder[b.risk];
      });
  }, [productionOrders]);

  // === BOTTLENECK DETECTION ===
  const bottleneckAnalysis = useMemo(() => {
    const sectorQueue: Record<string, number> = {};
    const sectorActive: Record<string, number> = {};
    productionOrders.filter(o => ['in_progress', 'planned', 'paused'].includes(o.status)).forEach(o => {
      const sector = o.sector || o.work_center || 'Geral';
      sectorQueue[sector] = (sectorQueue[sector] || 0) + 1;
      if (o.status === 'in_progress') sectorActive[sector] = (sectorActive[sector] || 0) + 1;
    });
    return Object.entries(sectorQueue)
      .map(([sector, queue]) => ({
        sector,
        queue,
        active: sectorActive[sector] || 0,
        ratio: (sectorActive[sector] || 0) > 0 ? queue / sectorActive[sector]! : queue,
        isBottleneck: queue >= 5,
      }))
      .filter(b => b.isBottleneck || b.ratio > 3)
      .sort((a, b) => b.queue - a.queue);
  }, [productionOrders]);

  // Cost data
  const totalProfit = totalRevenue - totalCostSum;
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const supplyValue = supplies.reduce((s, i) => s + i.total_value, 0);

  const costBreakdown = costs.length > 0 ? [
    { name: 'Mat. Prima', value: costs.reduce((s, c) => s + Number(c.raw_material_cost), 0) },
    { name: 'Mão de Obra', value: costs.reduce((s, c) => s + Number(c.labor_cost), 0) },
    { name: 'Operacional', value: costs.reduce((s, c) => s + Number(c.operational_cost), 0) },
  ] : [];
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--info))'];

  const topProducts = [...costs].sort((a, b) => b.profit_margin - a.profit_margin).slice(0, 10).map(c => ({
    name: c.product_name.length > 15 ? c.product_name.slice(0, 15) + '...' : c.product_name,
    margem: Number(c.profit_margin.toFixed(1)),
  }));

  // Alerts
  const allAlerts = [
    ...productionOrders.filter(o => o.due_date && differenceInDays(new Date(), parseISO(o.due_date)) > 0 && !['completed', 'cancelled'].includes(o.status)).map(o => ({
      id: `late-${o.id}`, type: 'Atraso', severity: 'critical' as const,
      title: `OP ${o.order_number} atrasada ${differenceInDays(new Date(), parseISO(o.due_date!))}d`, detail: o.product_name,
    })),
    ...lowStockItems.map(s => ({
      id: `stock-${s.id}`, type: 'Falta de Material', severity: 'critical' as const,
      title: `${s.name} em estoque crítico`, detail: `${s.current_quantity} ${s.unit} (mín: ${s.min_quantity})`,
    })),
    ...lowMarginProducts.map(c => ({
      id: `margin-${c.id}`, type: 'Margem Baixa', severity: 'warning' as const,
      title: `${c.product_name} com margem de ${c.profit_margin.toFixed(1)}%`, detail: `Custo: R$ ${c.total_cost.toFixed(2)}`,
    })),
    ...activeAlerts.map(a => ({
      id: a.id, type: a.alert_type, severity: a.severity as any,
      title: a.title, detail: a.description || '',
    })),
  ];

  const severityConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: <XCircle className="h-4 w-4 text-destructive" /> },
    warning: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: <AlertTriangle className="h-4 w-4 text-warning" /> },
    info: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: <CheckCircle className="h-4 w-4 text-info" /> },
  };

  return (
    <PageContainer>
      <PageHeader title="Dashboard Industrial" description="Visão completa: produção, eficiência, custos e alertas — tempo real">
        <div className="flex items-center gap-3">
          <Badge variant={realtimeActive ? 'default' : 'secondary'} className="flex items-center gap-1.5">
            <Radio className={cn('h-3 w-3', realtimeActive && 'animate-pulse text-green-400')} />
            {realtimeActive ? 'Ao Vivo' : 'Conectando...'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(lastRefresh, 'HH:mm:ss')}
          </span>
          <Button size="sm" variant="ghost" onClick={() => { refetchOrders(); refetchEntries(); setLastRefresh(new Date()); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      {/* Production KPIs Row 1 - Operational */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        <KPICard title="OEE" value={`${oee.toFixed(0)}%`} icon={<Gauge className="h-5 w-5" />} accentColor={oee >= 60 ? 'success' : oee >= 40 ? 'warning' : 'danger'} index={0} />
        <KPICard title="Em Produção" value={inProgressOPs} icon={<Factory className="h-5 w-5" />} accentColor="primary" index={1} />
        <KPICard title="Na Fila" value={plannedOPs} icon={<Clock className="h-5 w-5" />} accentColor="info" index={2} />
        <KPICard title="Atrasadas" value={lateOPs} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={3} />
        <KPICard title="Prazo %" value={`${onTimePct.toFixed(0)}%`} icon={<CheckCircle className="h-5 w-5" />} accentColor={onTimePct >= 80 ? 'success' : 'warning'} index={4} />
        <KPICard title="WIP" value={`${wipUnits.toLocaleString()} un`} icon={<Layers className="h-5 w-5" />} accentColor="info" index={5} />
        <KPICard title="Qualidade" value={`${(quality * 100).toFixed(0)}%`} icon={<Zap className="h-5 w-5" />} accentColor={quality >= 0.95 ? 'success' : 'warning'} index={6} />
        <KPICard title="Alertas" value={allAlerts.length} icon={<AlertTriangle className="h-5 w-5" />} accentColor={allAlerts.length > 0 ? 'danger' : 'success'} index={7} />
      </div>

      {/* Production KPIs Row 2 - Performance */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
        <KPICard title="Lead Time" value={`${avgLeadTime.toFixed(1)}d`} icon={<Activity className="h-5 w-5" />} accentColor="info" index={0} />
        <KPICard title="Ciclo/Peça" value={`${avgCycleTime.toFixed(1)} min`} icon={<Timer className="h-5 w-5" />} accentColor="primary" index={1} />
        <KPICard title="MTTR" value={`${mttr.toFixed(0)} min`} icon={<Wrench className="h-5 w-5" />} accentColor={mttr > 30 ? 'warning' : 'success'} index={2} />
        <KPICard title="Capacidade" value={`${avgCapLoad.toFixed(0)}%`} icon={<Gauge className="h-5 w-5" />} accentColor={avgCapLoad > 90 ? 'danger' : avgCapLoad > 70 ? 'warning' : 'success'} index={3} />
        <KPICard title="Produzidas" value={totalProduced.toLocaleString()} icon={<Package className="h-5 w-5" />} accentColor="success" index={4} />
        <KPICard title="Refugo" value={totalRejected.toLocaleString()} icon={<XCircle className="h-5 w-5" />} accentColor={totalRejected > 0 ? 'danger' : 'success'} index={5} />
      </div>

      <Tabs defaultValue="intelligence">
        <TabsList>
          <TabsTrigger value="intelligence">🧠 Inteligência</TabsTrigger>
          <TabsTrigger value="production">Produção</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="alerts">Alertas ({allAlerts.length})</TabsTrigger>
        </TabsList>

        {/* INTELLIGENCE TAB - Delay Predictions + Bottlenecks + Decisions */}
        <TabsContent value="intelligence" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <KPICard title="Risco de Atraso" value={delayPredictions.length} icon={<Brain className="h-5 w-5" />} accentColor={delayPredictions.length > 0 ? 'danger' : 'success'} index={0} />
            <KPICard title="Gargalos Detectados" value={bottleneckAnalysis.length} icon={<Zap className="h-5 w-5" />} accentColor={bottleneckAnalysis.length > 0 ? 'warning' : 'success'} index={1} />
            <KPICard title="OPs Críticas" value={delayPredictions.filter(p => p.risk === 'critical').length} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={2} />
          </div>

          {/* Delay Predictions */}
          {delayPredictions.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-destructive" /> Previsão de Atrasos — Motor Preditivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Risco</TableHead>
                      <TableHead>OP</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Diagnóstico</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {delayPredictions.slice(0, 15).map(p => (
                      <TableRow key={p.order.id}>
                        <TableCell>
                          <Badge className={cn(
                            p.risk === 'critical' ? 'bg-destructive/15 text-destructive' :
                            p.risk === 'high' ? 'bg-warning/15 text-warning' :
                            'bg-info/15 text-info'
                          )}>
                            {p.risk === 'critical' ? '🔴 Crítico' : p.risk === 'high' ? '🟠 Alto' : '🟡 Médio'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono font-medium">{p.order.order_number}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{p.order.product_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={p.progressPct} className="w-16 h-2" />
                            <span className="text-sm font-mono">{p.progressPct.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className={cn('font-mono', p.daysLeft < 0 ? 'text-destructive font-bold' : '')}>
                          {p.daysLeft < 0 ? `${Math.abs(p.daysLeft)}d atrás` : `${p.daysLeft}d`}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px]">{p.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Bottleneck Detection */}
          {bottleneckAnalysis.length > 0 && (
            <Card className="border-warning/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-warning" /> Gargalos Detectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {bottleneckAnalysis.map(b => (
                    <div key={b.sector} className="p-4 rounded-lg border bg-warning/5 border-warning/20">
                      <p className="font-semibold text-lg">{b.sector}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">Na fila: <strong className="text-foreground">{b.queue} OPs</strong></span>
                        <span className="text-muted-foreground">Ativas: <strong className="text-foreground">{b.active}</strong></span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        💡 Sugestão: {b.queue > 8 ? 'Redistribuir OPs para outros setores ou adicionar turno extra' : b.active === 0 ? 'Iniciar produção — há OPs aguardando' : 'Avaliar capacidade e priorizar OPs urgentes'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {delayPredictions.length === 0 && bottleneckAnalysis.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium">Operação saudável</p>
                <p className="text-sm text-muted-foreground">Nenhum risco de atraso ou gargalo detectado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          {/* Charts Row 1: Throughput + Status */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Throughput — Últimos 14 dias</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={throughputTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="produced" name="Peças Produzidas" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Area type="monotone" dataKey="completed" name="OPs Concluídas" fill="hsl(var(--info) / 0.2)" stroke="hsl(var(--info))" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Status das OPs</CardTitle></CardHeader>
              <CardContent>
                {statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={statusDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {statusDistribution.map((d, idx) => <Cell key={idx} fill={d.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center py-12 text-muted-foreground">Sem OPs</p>}
              </CardContent>
            </Card>
          </div>

          {/* Sector Efficiency */}
          {sectorEfficiency.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Eficiência por Setor</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-center">OPs</TableHead>
                    <TableHead className="text-center">Concluídas</TableHead>
                    <TableHead className="text-center">Peças</TableHead>
                    <TableHead className="text-center">WIP</TableHead>
                    <TableHead>Eficiência</TableHead>
                    <TableHead>Qualidade</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {sectorEfficiency.map(s => (
                      <TableRow key={s.sector}>
                        <TableCell className="font-medium">{s.sector}</TableCell>
                        <TableCell className="text-center">{s.ops}</TableCell>
                        <TableCell className="text-center">{s.completed}</TableCell>
                        <TableCell className="text-center">{s.produced.toLocaleString()}</TableCell>
                        <TableCell className="text-center font-mono">{s.wip > 0 ? s.wip.toLocaleString() : '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={s.efficiency} className="w-20 h-2" />
                            <span className="text-sm">{s.efficiency.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(s.quality >= 95 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300')}>
                            {s.quality.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Financial Row */}
          <div className="grid gap-4 md:grid-cols-5">
            <KPICard title="Receita" value={`R$ ${(totalRevenue / 1000).toFixed(1)}k`} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" index={0} />
            <KPICard title="Custo" value={`R$ ${(totalCostSum / 1000).toFixed(1)}k`} icon={<Factory className="h-5 w-5" />} accentColor="info" index={1} />
            <KPICard title="Lucro" value={`R$ ${(totalProfit / 1000).toFixed(1)}k`} icon={<TrendingUp className="h-5 w-5" />} accentColor="success" index={2} />
            <KPICard title="Margem" value={`${overallMargin.toFixed(1)}%`} icon={<Gauge className="h-5 w-5" />} accentColor={overallMargin >= 20 ? 'success' : 'warning'} index={3} />
            <KPICard title="Insumos" value={`R$ ${(supplyValue / 1000).toFixed(1)}k`} icon={<Package className="h-5 w-5" />} accentColor="info" index={4} />
          </div>

          {/* Charts Row 2: Costs + Top Products */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Composição de Custos</CardTitle></CardHeader>
              <CardContent>
                {costBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={costBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                        {costBreakdown.map((_, idx) => <Cell key={idx} fill={COLORS[idx]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center py-8 text-muted-foreground">Cadastre custos para ver</p>}
              </CardContent>
            </Card>

            {topProducts.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Top 10 Produtos por Margem</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="margem" fill="hsl(var(--primary))" name="Margem %" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {allAlerts.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" /><p className="text-lg font-medium">Nenhum alerta ativo</p></CardContent></Card>
          ) : (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" /> Alertas Inteligentes ({allAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Tipo</TableHead><TableHead>Alerta</TableHead><TableHead>Detalhe</TableHead><TableHead>Severidade</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {allAlerts.slice(0, 20).map(a => {
                      const sev = severityConfig[a.severity] || severityConfig.warning;
                      return (
                        <TableRow key={a.id}>
                          <TableCell>{a.type}</TableCell>
                          <TableCell className="font-medium">{a.title}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{a.detail}</TableCell>
                          <TableCell><Badge className={sev.color}>{a.severity}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
