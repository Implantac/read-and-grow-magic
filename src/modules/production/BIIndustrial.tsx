import { useMemo, useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { useProductCosts } from '@/hooks/production/useProductCosts';
import { useProductionOrders } from '@/hooks/production/useProductionOrders';
import { useTimeEntries } from '@/hooks/system/useTimeEntries';
import { useProductionCapacity } from '@/hooks/production/useProductionCapacity';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Factory, Target, Gauge, AlertTriangle, Award, Layers, PieChart as PieIcon, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine } from 'recharts';
import { differenceInDays, differenceInMinutes, parseISO, subDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/ui/base/progress';
import { formatBRL } from '@/lib/formatters';


const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];

export default function BIIndustrialPage() {
  const { costs, avgMargin, totalRevenue, totalCostSum, lowMarginProducts, highCostProducts } = useProductCosts();
  const { orders } = useProductionOrders();
  const { entries } = useTimeEntries();
  const { capacities } = useProductionCapacity();
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  const periodDays = Number(period);

  // === Profit by Product ===
  const profitByProduct = useMemo(() => {
    return costs
      .filter(c => c.sale_price > 0)
      .map(c => ({
        product: c.product_name.length > 20 ? c.product_name.slice(0, 20) + '…' : c.product_name,
        fullName: c.product_name,
        revenue: c.sale_price,
        cost: c.total_cost,
        profit: c.sale_price - c.total_cost,
        margin: c.profit_margin,
      }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 15);
  }, [costs]);

  // === Pareto Analysis (ABC) ===
  const paretoData = useMemo(() => {
    const sorted = costs.filter(c => c.sale_price > 0).sort((a, b) => (b.sale_price - b.total_cost) - (a.sale_price - a.total_cost));
    const totalProfit = sorted.reduce((s, c) => s + Math.max(0, c.sale_price - c.total_cost), 0);
    let cumulative = 0;
    return sorted.slice(0, 20).map(c => {
      const profit = Math.max(0, c.sale_price - c.total_cost);
      cumulative += profit;
      const cumPct = totalProfit > 0 ? (cumulative / totalProfit) * 100 : 0;
      return {
        product: c.product_name.length > 15 ? c.product_name.slice(0, 15) + '…' : c.product_name,
        profit,
        cumPct: +cumPct.toFixed(1),
        class: cumPct <= 80 ? 'A' : cumPct <= 95 ? 'B' : 'C',
      };
    });
  }, [costs]);

  // === Cost by Process/Sector ===
  const costBySector = useMemo(() => {
    const sectorMap: Record<string, { laborMin: number; produced: number; orders: number; rejected: number; estMin: number }> = {};
    orders.forEach(o => {
      const sector = o.sector || o.work_center || 'Geral';
      if (!sectorMap[sector]) sectorMap[sector] = { laborMin: 0, produced: 0, orders: 0, rejected: 0, estMin: 0 };
      sectorMap[sector].laborMin += o.realized_time_minutes;
      sectorMap[sector].produced += o.produced_quantity;
      sectorMap[sector].orders += 1;
      sectorMap[sector].rejected += o.rejected_quantity;
      sectorMap[sector].estMin += o.estimated_time_minutes;
    });
    return Object.entries(sectorMap).map(([sector, v]) => ({
      sector,
      laborHours: +(v.laborMin / 60).toFixed(1),
      produced: v.produced,
      costPerUnit: v.produced > 0 ? +(v.laborMin / v.produced).toFixed(2) : 0,
      orders: v.orders,
      rejected: v.rejected,
      rejectRate: v.produced > 0 ? +((v.rejected / (v.produced + v.rejected)) * 100).toFixed(1) : 0,
      efficiency: v.estMin > 0 ? +((v.estMin / Math.max(v.laborMin, 1)) * 100).toFixed(1) : 0,
    })).sort((a, b) => b.laborHours - a.laborHours);
  }, [orders]);

  // === OEE ===
  const totalEstimated = orders.reduce((s, o) => s + o.estimated_time_minutes, 0);
  const totalRealized = orders.reduce((s, o) => s + o.realized_time_minutes, 0);
  const totalProduced = orders.reduce((s, o) => s + o.produced_quantity, 0);
  const totalTarget = orders.filter(o => ['completed', 'in_progress'].includes(o.status)).reduce((s, o) => s + o.quantity, 0);
  const totalRejected = orders.reduce((s, o) => s + o.rejected_quantity, 0);
  const availability = totalEstimated > 0 ? Math.min(totalRealized / totalEstimated, 1) : 0;
  const performance = totalTarget > 0 ? Math.min(totalProduced / totalTarget, 1) : 0;
  const quality = totalProduced > 0 ? (totalProduced - totalRejected) / totalProduced : 1;
  const oee = availability * performance * quality * 100;

  // === Trend (last N days) ===
  const productionTrend = useMemo(() => {
    const days: Record<string, { produced: number; rejected: number; hours: number }> = {};
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'dd/MM');
      days[d] = { produced: 0, rejected: 0, hours: 0 };
    }
    entries.filter(e => e.status === 'completed' && e.end_time).forEach(e => {
      const d = format(new Date(e.start_time), 'dd/MM');
      if (days[d]) {
        days[d].produced += e.produced_quantity;
        days[d].rejected += e.rejected_quantity;
        days[d].hours += differenceInMinutes(new Date(e.end_time!), new Date(e.start_time)) / 60;
      }
    });
    return Object.entries(days).map(([day, v]) => ({ day, ...v, pcsH: v.hours > 0 ? +(v.produced / v.hours).toFixed(1) : 0, yieldRate: (v.produced + v.rejected) > 0 ? +(v.produced / (v.produced + v.rejected) * 100).toFixed(1) : 100 }));
  }, [entries, periodDays]);

  // === On-time delivery ===
  const completedOPs = orders.filter(o => o.status === 'completed' && o.completed_date && o.due_date);
  const onTime = completedOPs.filter(o => new Date(o.completed_date!) <= new Date(o.due_date!)).length;
  const onTimePct = completedOPs.length > 0 ? (onTime / completedOPs.length) * 100 : 0;
  const lateOPs = orders.filter(o => o.due_date && !['completed', 'cancelled'].includes(o.status) && differenceInDays(new Date(), parseISO(o.due_date)) > 0);

  // === Executive Scorecards ===
  const avgLeadTime = useMemo(() => {
    const completed = orders.filter(o => o.status === 'completed' && o.start_date && o.completed_date);
    if (completed.length === 0) return 0;
    return completed.reduce((s, o) => s + differenceInDays(new Date(o.completed_date!), new Date(o.start_date)), 0) / completed.length;
  }, [orders]);

  const capacityUtilization = useMemo(() => {
    if (capacities.length === 0) return 0;
    return capacities.reduce((s, c) => s + c.current_load_pct, 0) / capacities.length;
  }, [capacities]);

  // Margin distribution
  const marginDist = useMemo(() => {
    const brackets = [
      { label: 'Negativa', count: 0, fill: 'hsl(var(--destructive))' },
      { label: '0-10%', count: 0, fill: 'hsl(var(--chart-4))' },
      { label: '10-20%', count: 0, fill: 'hsl(var(--chart-3))' },
      { label: '20-30%', count: 0, fill: 'hsl(var(--chart-2))' },
      { label: '30%+', count: 0, fill: 'hsl(var(--primary))' },
    ];
    costs.forEach(c => {
      if (c.profit_margin < 0) brackets[0].count++;
      else if (c.profit_margin < 10) brackets[1].count++;
      else if (c.profit_margin < 20) brackets[2].count++;
      else if (c.profit_margin < 30) brackets[3].count++;
      else brackets[4].count++;
    });
    return brackets;
  }, [costs]);

  // === Strategic Indicators ===
  const strategicIndicators = useMemo(() => {
    const totalGrossProfit = totalRevenue - totalCostSum;
    const costPerPiece = totalProduced > 0 ? totalCostSum / totalProduced : 0;
    const revenuePerHour = totalRealized > 0 ? totalRevenue / (totalRealized / 60) : 0;
    const scrapCostEstimate = totalRejected * costPerPiece;
    
    return {
      grossProfit: totalGrossProfit,
      costPerPiece,
      revenuePerHour,
      scrapCostEstimate,
      scrapRate: totalProduced > 0 ? (totalRejected / (totalProduced + totalRejected)) * 100 : 0,
    };
  }, [totalRevenue, totalCostSum, totalProduced, totalRejected, totalRealized]);

  const fmt = (n: number) =>formatBRL(n);

  const exportData = costBySector.map(s => ({
    Setor: s.sector, OPs: s.orders, Horas: s.laborHours, Produzido: s.produced, Refugo: s.rejected, 'Refugo%': s.rejectRate, 'Min/Peça': s.costPerUnit, 'Eficiência%': s.efficiency,
  }));

  return (
    <PageContainer>
      <PageHeader title="📊 BI Industrial — Enterprise" description="Business Intelligence estratégico: Pareto, indicadores, custos e eficiência produtiva">
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={v => setPeriod(v as any)}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
          
        </div>
      </PageHeader>

      {/* Executive Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <KPICard title="Receita Total" value={formatBRL(totalRevenue)} icon={<DollarSign className="h-4 w-4" />} accentColor="success" index={0} />
        <KPICard title="Lucro Bruto" value={formatBRL(strategicIndicators.grossProfit)} icon={<TrendingUp className="h-4 w-4" />} accentColor={strategicIndicators.grossProfit > 0 ? 'success' : 'danger'} index={1} />
        <KPICard title="Margem Média" value={`${avgMargin.toFixed(1)}%`} icon={<BarChart3 className="h-4 w-4" />} accentColor={avgMargin >= 20 ? 'success' : 'warning'} index={2} />
        <KPICard title="OEE Global" value={`${oee.toFixed(1)}%`} icon={<Gauge className="h-4 w-4" />} accentColor={oee >= 70 ? 'success' : oee >= 50 ? 'warning' : 'danger'} index={3} />
        <KPICard title="On-Time" value={`${onTimePct.toFixed(0)}%`} icon={<Target className="h-4 w-4" />} accentColor={onTimePct >= 90 ? 'success' : 'warning'} index={4} />
        <KPICard title="Lead Time" value={`${avgLeadTime.toFixed(1)}d`} icon={<Activity className="h-4 w-4" />} accentColor={avgLeadTime <= 5 ? 'success' : 'warning'} index={5} />
        <KPICard title="Utilização" value={`${capacityUtilization.toFixed(0)}%`} icon={<Factory className="h-4 w-4" />} accentColor={capacityUtilization > 90 ? 'danger' : 'success'} index={6} />
        <KPICard title="Custo Refugo" value={formatBRL(strategicIndicators.scrapCostEstimate)} icon={<AlertTriangle className="h-4 w-4" />} accentColor={strategicIndicators.scrapRate > 5 ? 'danger' : 'success'} index={7} />
      </div>

      <Tabs defaultValue="executive" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="executive">📈 Executivo</TabsTrigger>
          <TabsTrigger value="pareto">🏆 Pareto ABC</TabsTrigger>
          <TabsTrigger value="profit">💰 Lucro por Produto</TabsTrigger>
          <TabsTrigger value="cost">🏭 Custo por Processo</TabsTrigger>
          <TabsTrigger value="oee">⚙️ OEE</TabsTrigger>
          <TabsTrigger value="trend">📊 Tendências</TabsTrigger>
          <TabsTrigger value="strategic">🎯 Indicadores Estratégicos</TabsTrigger>
        </TabsList>

        {/* Executive Tab */}
        <TabsContent value="executive" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">Receita por Hora Trabalhada</p>
                <p className="text-4xl font-black text-primary">{formatBRL(strategicIndicators.revenuePerHour)}</p>
                <p className="text-xs text-muted-foreground">Eficiência monetária da produção</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">Custo Médio por Peça</p>
                <p className="text-4xl font-black">{formatBRL(strategicIndicators.costPerPiece)}</p>
                <p className="text-xs text-muted-foreground">Considerando custo total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">Taxa de Refugo</p>
                <p className={cn('text-4xl font-black', strategicIndicators.scrapRate > 5 ? 'text-destructive' : 'text-success')}>{strategicIndicators.scrapRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{totalRejected} peças rejeitadas de {totalProduced + totalRejected}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Produção & Qualidade ({period} dias)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={productionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" fontSize={10} interval={Math.floor(periodDays / 10)} />
                    <YAxis yAxisId="left" fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" fontSize={11} domain={[80, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="produced" name="Produzido" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="yieldRate" name="Yield %" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Distribuição de Margens</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={marginDist} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={100} label={({ label, count }) => count > 0 ? `${label}: ${count}` : ''}>
                      {marginDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pareto ABC Tab */}
        <TabsContent value="pareto" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" /> Análise Pareto ABC — Lucro Acumulado</CardTitle>
            </CardHeader>
            <CardContent>
              {paretoData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={paretoData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="product" fontSize={10} angle={-30} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" fontSize={11} tickFormatter={v => `R$${v}`} />
                    <YAxis yAxisId="right" orientation="right" fontSize={11} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="profit" name="Lucro" radius={[4, 4, 0, 0]}>
                      {paretoData.map((entry, i) => (
                        <Cell key={i} fill={entry.class === 'A' ? 'hsl(var(--primary))' : entry.class === 'B' ? 'hsl(var(--chart-3))' : 'hsl(var(--muted-foreground))'} />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="cumPct" name="% Acumulado" stroke="hsl(var(--destructive))" strokeWidth={2} dot />
                    <ReferenceLine yAxisId="right" y={80} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label="80%" />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground py-8">Sem dados de custos para análise Pareto</p>}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            {['A', 'B', 'C'].map(cls => {
              const items = paretoData.filter(p => p.class === cls);
              const totalP = items.reduce((s, p) => s + p.profit, 0);
              return (
                <Card key={cls}>
                  <CardContent className="pt-6 text-center space-y-2">
                    <Badge variant={cls === 'A' ? 'default' : cls === 'B' ? 'secondary' : 'outline'} className="text-lg px-4 py-1">Classe {cls}</Badge>
                    <p className="text-3xl font-bold">{items.length} produtos</p>
                    <p className="text-sm text-muted-foreground">Lucro: {formatBRL(totalP)}</p>
                    <p className="text-xs text-muted-foreground">{cls === 'A' ? '80% do lucro total' : cls === 'B' ? '15% do lucro total' : '5% do lucro total'}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Profit Tab */}
        <TabsContent value="profit" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Lucro por Produto (Top 15)</CardTitle></CardHeader>
              <CardContent>
                {profitByProduct.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={profitByProduct} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={11} tickFormatter={v => `R$${v}`} />
                      <YAxis dataKey="product" type="category" width={120} fontSize={11} />
                      <Tooltip formatter={(v: number) => formatBRL(v)} />
                      <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                        {profitByProduct.map((entry, i) => (
                          <Cell key={i} fill={entry.margin < 10 ? 'hsl(var(--destructive))' : entry.margin < 20 ? 'hsl(var(--chart-3))' : 'hsl(var(--primary))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Sem dados de custos</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Receita × Custo × Lucro</CardTitle></CardHeader>
              <CardContent>
                {profitByProduct.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={profitByProduct.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={11} tickFormatter={v => `R$${v}`} />
                      <YAxis dataKey="product" type="category" width={120} fontSize={11} />
                      <Tooltip formatter={(v: number) => formatBRL(v)} />
                      <Legend />
                      <Bar dataKey="revenue" name="Receita" fill="hsl(var(--chart-2))" stackId="a" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="cost" name="Custo" fill="hsl(var(--destructive))" stackId="b" radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
              </CardContent>
            </Card>
          </div>

          {lowMarginProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Produtos com Margem Crítica</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Produto</TableHead><TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead className="text-right">Custo Total</TableHead><TableHead className="text-right">Margem</TableHead><TableHead>Ação</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {lowMarginProducts.slice(0, 10).map(p => (
                      <TableRow key={p.product_code}>
                        <TableCell className="font-medium">{p.product_name}</TableCell>
                        <TableCell className="text-right">{formatBRL(p.sale_price)}</TableCell>
                        <TableCell className="text-right">{formatBRL(p.total_cost)}</TableCell>
                        <TableCell className="text-right"><span className={cn('font-bold', p.profit_margin < 0 ? 'text-destructive' : 'text-warning')}>{p.profit_margin.toFixed(1)}%</span></TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{p.profit_margin < 0 ? '🔴 Revisar preço' : '🟡 Otimizar custo'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cost by Sector Tab */}
        <TabsContent value="cost" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Horas × Eficiência por Setor</CardTitle></CardHeader>
              <CardContent>
                {costBySector.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={costBySector}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sector" fontSize={11} />
                      <YAxis yAxisId="left" fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" fontSize={11} domain={[0, 150]} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="laborHours" name="Horas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="efficiency" name="Eficiência %" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Refugo por Setor (%)</CardTitle></CardHeader>
              <CardContent>
                {costBySector.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={costBySector}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sector" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <ReferenceLine y={5} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label="Meta 5%" />
                      <Bar dataKey="rejectRate" name="Refugo %" radius={[4, 4, 0, 0]}>
                        {costBySector.map((entry, i) => (
                          <Cell key={i} fill={entry.rejectRate > 10 ? 'hsl(var(--destructive))' : entry.rejectRate > 5 ? 'hsl(var(--chart-3))' : 'hsl(var(--chart-2))'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Detalhamento por Setor</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Setor</TableHead><TableHead className="text-right">OPs</TableHead>
                  <TableHead className="text-right">Horas</TableHead><TableHead className="text-right">Produzido</TableHead>
                  <TableHead className="text-right">Refugo</TableHead><TableHead className="text-right">Refugo%</TableHead>
                  <TableHead className="text-right">Min/Peça</TableHead><TableHead className="text-right">Eficiência</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {costBySector.map(s => (
                    <TableRow key={s.sector}>
                      <TableCell className="font-medium">{s.sector}</TableCell>
                      <TableCell className="text-right">{s.orders}</TableCell>
                      <TableCell className="text-right">{s.laborHours}h</TableCell>
                      <TableCell className="text-right">{s.produced}</TableCell>
                      <TableCell className="text-right text-destructive">{s.rejected}</TableCell>
                      <TableCell className="text-right"><span className={cn(s.rejectRate > 5 ? 'text-destructive font-bold' : '')}>{s.rejectRate}%</span></TableCell>
                      <TableCell className="text-right font-mono">{s.costPerUnit}</TableCell>
                      <TableCell className="text-right"><span className={cn(s.efficiency >= 90 ? 'text-success font-bold' : s.efficiency >= 70 ? '' : 'text-warning')}>{s.efficiency}%</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OEE Tab */}
        <TabsContent value="oee" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Disponibilidade', value: availability * 100, desc: 'Tempo real vs estimado' },
              { label: 'Performance', value: performance * 100, desc: 'Produzido vs planejado' },
              { label: 'Qualidade', value: quality * 100, desc: 'Peças boas vs total' },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="pt-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className={cn('text-5xl font-extrabold', item.value >= 85 ? 'text-success' : item.value >= 60 ? 'text-warning' : 'text-destructive')}>
                    {item.value.toFixed(1)}%
                  </p>
                  <Progress value={item.value} className="h-3" />
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="pt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">OEE Global</p>
              <p className={cn('text-7xl font-black', oee >= 85 ? 'text-success' : oee >= 60 ? 'text-warning' : 'text-destructive')}>{oee.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Disponibilidade × Performance × Qualidade</p>
              <div className="flex justify-center gap-4 mt-4">
                <Badge variant="outline" className="text-xs">World Class: ≥ 85%</Badge>
                <Badge variant="outline" className="text-xs">Bom: ≥ 60%</Badge>
                <Badge variant="outline" className="text-xs">Crítico: {'<'} 60%</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Tab */}
        <TabsContent value="trend" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Produção Diária ({period} dias)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={productionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" fontSize={10} interval={Math.floor(periodDays / 10)} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="produced" name="Produzido" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                    <Area type="monotone" dataKey="rejected" name="Refugo" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Produtividade (peças/h)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" fontSize={10} interval={Math.floor(periodDays / 10)} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="pcsH" name="Peças/h" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Strategic Indicators Tab */}
        <TabsContent value="strategic" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'MTTR (Tempo Reparo)', value: '—', desc: 'Requer dados de manutenção', icon: <Activity className="h-6 w-6 text-primary" /> },
              { label: 'Custo de Não-Qualidade', value: formatBRL(strategicIndicators.scrapCostEstimate), desc: `${totalRejected} peças × ${formatBRL(strategicIndicators.costPerPiece)}/peça`, icon: <AlertTriangle className="h-6 w-6 text-destructive" /> },
              { label: 'Valor Agregado/Hora', value: formatBRL(strategicIndicators.revenuePerHour), desc: 'Receita por hora produtiva', icon: <DollarSign className="h-6 w-6 text-success" /> },
              { label: 'On-Time Delivery', value: `${onTimePct.toFixed(0)}%`, desc: `${onTime} de ${completedOPs.length} OPs no prazo`, icon: <Target className="h-6 w-6 text-primary" /> },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="pt-6 text-center space-y-2">
                  <div className="mx-auto w-fit">{item.icon}</div>
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {lateOPs.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> OPs Atrasadas ({lateOPs.length})</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>OP</TableHead><TableHead>Produto</TableHead><TableHead>Prazo</TableHead><TableHead className="text-right">Atraso</TableHead><TableHead>Prioridade</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {lateOPs.slice(0, 10).map(o => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono">{o.order_number}</TableCell>
                        <TableCell>{o.product_name}</TableCell>
                        <TableCell>{format(new Date(o.due_date!), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-right text-destructive font-bold">{differenceInDays(new Date(), parseISO(o.due_date!))}d</TableCell>
                        <TableCell><Badge variant={o.priority === 'urgent' ? 'destructive' : 'outline'}>{o.priority}</Badge></TableCell>
                      </TableRow>
                    ))}
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
