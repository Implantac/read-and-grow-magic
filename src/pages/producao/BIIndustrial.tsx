import { useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductCosts } from '@/hooks/useProductCosts';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useProductionCapacity } from '@/hooks/useProductionCapacity';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, Factory, Target, Gauge, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { differenceInDays, differenceInMinutes, parseISO, subDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];

export default function BIIndustrialPage() {
  const { costs, avgMargin, totalRevenue, totalCostSum, lowMarginProducts, highCostProducts } = useProductCosts();
  const { orders } = useProductionOrders();
  const { entries } = useTimeEntries();
  const { capacities } = useProductionCapacity();

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

  // === Cost by Process/Sector ===
  const costBySector = useMemo(() => {
    const sectorMap: Record<string, { laborMin: number; produced: number; orders: number }> = {};
    orders.forEach(o => {
      const sector = o.sector || o.work_center || 'Geral';
      if (!sectorMap[sector]) sectorMap[sector] = { laborMin: 0, produced: 0, orders: 0 };
      sectorMap[sector].laborMin += o.realized_time_minutes;
      sectorMap[sector].produced += o.produced_quantity;
      sectorMap[sector].orders += 1;
    });
    return Object.entries(sectorMap).map(([sector, v]) => ({
      sector,
      laborHours: +(v.laborMin / 60).toFixed(1),
      produced: v.produced,
      costPerUnit: v.produced > 0 ? +(v.laborMin / v.produced).toFixed(2) : 0,
      orders: v.orders,
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

  // === Trend (last 30 days) ===
  const productionTrend = useMemo(() => {
    const days: Record<string, { produced: number; rejected: number; hours: number }> = {};
    for (let i = 29; i >= 0; i--) {
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
    return Object.entries(days).map(([day, v]) => ({ day, ...v, pcsH: v.hours > 0 ? +(v.produced / v.hours).toFixed(1) : 0 }));
  }, [entries]);

  // === On-time delivery ===
  const completedOPs = orders.filter(o => o.status === 'completed' && o.completed_date && o.due_date);
  const onTime = completedOPs.filter(o => new Date(o.completed_date!) <= new Date(o.due_date!)).length;
  const onTimePct = completedOPs.length > 0 ? (onTime / completedOPs.length) * 100 : 0;

  const lateOPs = orders.filter(o => o.due_date && !['completed', 'cancelled'].includes(o.status) && differenceInDays(new Date(), parseISO(o.due_date)) > 0);

  // Margin distribution
  const marginDist = useMemo(() => {
    const brackets = [
      { label: '< 0%', count: 0 },
      { label: '0-10%', count: 0 },
      { label: '10-20%', count: 0 },
      { label: '20-30%', count: 0 },
      { label: '30%+', count: 0 },
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

  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <PageContainer>
      <PageHeader title="📊 BI Industrial" description="Business Intelligence — Análise estratégica de custos, lucros e eficiência produtiva" />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KPICard title="Receita Total" value={fmt(totalRevenue)} icon={<DollarSign className="h-5 w-5" />} accentColor="success" index={0} />
        <KPICard title="Custo Total" value={fmt(totalCostSum)} icon={<TrendingDown className="h-5 w-5" />} accentColor="danger" index={1} />
        <KPICard title="Margem Média" value={`${avgMargin.toFixed(1)}%`} icon={<TrendingUp className="h-5 w-5" />} accentColor={avgMargin >= 20 ? 'success' : 'warning'} index={2} />
        <KPICard title="OEE" value={`${oee.toFixed(1)}%`} icon={<Gauge className="h-5 w-5" />} accentColor={oee >= 70 ? 'success' : oee >= 50 ? 'warning' : 'danger'} index={3} />
        <KPICard title="On-Time Delivery" value={`${onTimePct.toFixed(0)}%`} icon={<Target className="h-5 w-5" />} accentColor={onTimePct >= 90 ? 'success' : 'warning'} index={4} />
        <KPICard title="OPs Atrasadas" value={lateOPs.length} icon={<AlertTriangle className="h-5 w-5" />} accentColor={lateOPs.length > 0 ? 'danger' : 'success'} index={5} />
      </div>

      <Tabs defaultValue="profit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profit">Lucro por Produto</TabsTrigger>
          <TabsTrigger value="cost">Custo por Processo</TabsTrigger>
          <TabsTrigger value="oee">OEE Detalhado</TabsTrigger>
          <TabsTrigger value="trend">Tendências</TabsTrigger>
        </TabsList>

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
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Sem dados de custos</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Distribuição de Margens</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={marginDist} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={100} label={({ label, count }) => `${label}: ${count}`}>
                      {marginDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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
                    <TableHead className="text-right">Custo Total</TableHead><TableHead className="text-right">Margem</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {lowMarginProducts.slice(0, 10).map(p => (
                      <TableRow key={p.product_code}>
                        <TableCell className="font-medium">{p.product_name}</TableCell>
                        <TableCell className="text-right">{fmt(p.sale_price)}</TableCell>
                        <TableCell className="text-right">{fmt(p.total_cost)}</TableCell>
                        <TableCell className="text-right"><span className={cn('font-bold', p.profit_margin < 0 ? 'text-destructive' : 'text-warning')}>{p.profit_margin.toFixed(1)}%</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Horas de Trabalho por Setor</CardTitle></CardHeader>
              <CardContent>
                {costBySector.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={costBySector}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sector" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="laborHours" name="Horas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Custo Unitário (min/peça) por Setor</CardTitle></CardHeader>
              <CardContent>
                {costBySector.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={costBySector}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sector" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="costPerUnit" name="Min/Peça" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
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
                  <TableHead className="text-right">Min/Peça</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {costBySector.map(s => (
                    <TableRow key={s.sector}>
                      <TableCell className="font-medium">{s.sector}</TableCell>
                      <TableCell className="text-right">{s.orders}</TableCell>
                      <TableCell className="text-right">{s.laborHours}h</TableCell>
                      <TableCell className="text-right">{s.produced}</TableCell>
                      <TableCell className="text-right font-mono">{s.costPerUnit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="trend" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Produção Diária (30 dias)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={productionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" fontSize={10} interval={4} />
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
                    <XAxis dataKey="day" fontSize={10} interval={4} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="pcsH" name="Peças/h" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
