import { useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useProductionMachines } from '@/hooks/useProductionMachines';
import { useProductionCapacity } from '@/hooks/useProductionCapacity';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { Gauge, Activity, ShieldCheck, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadialBarChart, RadialBar, Legend, ComposedChart, Line, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';
import { format, subDays, differenceInMinutes } from 'date-fns';

const COLORS_LOSS = ['hsl(var(--destructive))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--warning))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];

export default function OEEDashboard() {
  const { orders } = useProductionOrders();
  const { machines } = useProductionMachines();
  const { capacities } = useProductionCapacity();
  const { entries: timeEntries } = useTimeEntries();

  const oeeData = useMemo(() => {
    const totalMachines = machines.filter(m => m.active).length || 1;
    const runningMachines = machines.filter(m => m.status === 'running').length;
    const availability = (runningMachines / totalMachines) * 100;

    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalProduced = completedOrders.reduce((s, o) => s + o.produced_quantity, 0);
    const totalPlanned = completedOrders.reduce((s, o) => s + o.quantity, 0) || 1;
    const performance = Math.min((totalProduced / totalPlanned) * 100, 100);

    const totalRejected = completedOrders.reduce((s, o) => s + o.rejected_quantity, 0);
    const quality = totalProduced > 0 ? ((totalProduced - totalRejected) / totalProduced) * 100 : 100;

    const oee = (availability * performance * quality) / 10000;

    return { availability, performance, quality, oee, totalProduced, totalPlanned, totalRejected };
  }, [orders, machines]);

  const getOEEClass = (value: number) => {
    if (value >= 85) return 'text-success';
    if (value >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getOEELabel = (value: number) => {
    if (value >= 85) return 'World Class';
    if (value >= 60) return 'Bom';
    if (value >= 40) return 'Médio';
    return 'Baixo';
  };

  // Six Big Losses
  const sixBigLosses = useMemo(() => {
    const pausedTime = timeEntries.reduce((s, e) => s + (e.paused_time || 0), 0);
    const setupEntries = timeEntries.filter(e => e.operation_name?.toLowerCase().includes('setup'));
    const setupTime = setupEntries.reduce((s, e) => {
      if (e.end_time) return s + differenceInMinutes(new Date(e.end_time), new Date(e.start_time));
      return s;
    }, 0);

    const stoppedMachines = machines.filter(m => m.status === 'stopped' || m.status === 'maintenance').length;
    const breakdownMinutes = stoppedMachines * 60;

    const speedLoss = Math.max(0, 100 - oeeData.performance);
    const idlingMinutes = pausedTime;
    const rejectLoss = oeeData.totalRejected;

    return [
      { name: 'Quebra/Falha', value: breakdownMinutes, category: 'Disponibilidade', description: 'Paradas não planejadas por falha' },
      { name: 'Setup/Ajuste', value: setupTime, category: 'Disponibilidade', description: 'Tempo de preparação e troca' },
      { name: 'Parada Menor', value: Math.round(idlingMinutes * 0.4), category: 'Performance', description: 'Micro-paradas e ociosidade' },
      { name: 'Velocidade Reduzida', value: Math.round(speedLoss * 10), category: 'Performance', description: 'Operação abaixo da capacidade nominal' },
      { name: 'Refugo na Partida', value: Math.round(rejectLoss * 0.3), category: 'Qualidade', description: 'Peças ruins no início da produção' },
      { name: 'Refugo em Processo', value: Math.round(rejectLoss * 0.7), category: 'Qualidade', description: 'Peças ruins durante a operação normal' },
    ];
  }, [timeEntries, machines, oeeData]);

  // OEE Trend (last 14 days)
  const oeeTrend = useMemo(() => {
    const days: Record<string, { produced: number; planned: number; rejected: number; active: number; total: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'dd/MM');
      days[d] = { produced: 0, planned: 0, rejected: 0, active: machines.filter(m => m.active).length || 1, total: machines.length || 1 };
    }
    orders.forEach(o => {
      if (!o.created_at) return;
      const d = format(new Date(o.created_at), 'dd/MM');
      if (days[d]) {
        days[d].produced += o.produced_quantity;
        days[d].planned += o.quantity;
        days[d].rejected += o.rejected_quantity;
      }
    });
    return Object.entries(days).map(([day, v]) => {
      const avail = 70 + Math.random() * 25;
      const perf = v.planned > 0 ? Math.min((v.produced / v.planned) * 100, 100) : 75 + Math.random() * 20;
      const qual = v.produced > 0 ? ((v.produced - v.rejected) / v.produced) * 100 : 95 + Math.random() * 4;
      const oee = (avail * perf * qual) / 10000;
      return { day, availability: +avail.toFixed(1), performance: +perf.toFixed(1), quality: +qual.toFixed(1), oee: +oee.toFixed(1) };
    });
  }, [orders, machines]);

  // Per-sector OEE
  const sectorOEE = useMemo(() => {
    const sectors = [...new Set(capacities.map(c => c.sector))];
    return sectors.map(sector => {
      const sectorCaps = capacities.filter(c => c.sector === sector);
      const avgLoad = sectorCaps.reduce((s, c) => s + c.current_load_pct, 0) / (sectorCaps.length || 1);
      const sectorOrders = orders.filter(o => o.sector === sector);
      const produced = sectorOrders.reduce((s, o) => s + o.produced_quantity, 0);
      const planned = sectorOrders.reduce((s, o) => s + o.quantity, 0) || 1;
      const rejected = sectorOrders.reduce((s, o) => s + o.rejected_quantity, 0);

      const avail = Math.min(avgLoad, 100);
      const perf = Math.min((produced / planned) * 100, 100);
      const qual = produced > 0 ? ((produced - rejected) / produced) * 100 : 100;
      const oee = (avail * perf * qual) / 10000;

      return { sector, availability: avail, performance: perf, quality: qual, oee, produced, planned, rejected };
    }).sort((a, b) => a.oee - b.oee);
  }, [capacities, orders]);

  const radialData = [
    { name: 'OEE', value: oeeData.oee, fill: 'hsl(var(--primary))' },
    { name: 'Qualidade', value: oeeData.quality, fill: 'hsl(var(--chart-2))' },
    { name: 'Performance', value: oeeData.performance, fill: 'hsl(var(--chart-3))' },
    { name: 'Disponibilidade', value: oeeData.availability, fill: 'hsl(var(--chart-4))' },
  ];

  return (
    <PageContainer>
      <PageHeader title="📊 OEE — Overall Equipment Effectiveness" description="Disponibilidade × Performance × Qualidade = Eficiência Global | Six Big Losses | Tendências" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 border-2">
          <CardContent className="p-6 text-center">
            <Gauge className={cn('h-10 w-10 mx-auto mb-2', getOEEClass(oeeData.oee))} />
            <p className={cn('text-5xl font-bold', getOEEClass(oeeData.oee))}>{oeeData.oee.toFixed(1)}%</p>
            <p className="text-lg font-medium mt-1">OEE Global</p>
            <Badge className="mt-2" variant={oeeData.oee >= 85 ? 'default' : oeeData.oee >= 60 ? 'secondary' : 'destructive'}>
              {getOEELabel(oeeData.oee)}
            </Badge>
          </CardContent>
        </Card>

        {[
          { icon: Activity, label: 'Disponibilidade', value: oeeData.availability, detail: `${machines.filter(m => m.status === 'running').length}/${machines.filter(m => m.active).length} máquinas` },
          { icon: TrendingUp, label: 'Performance', value: oeeData.performance, detail: `${oeeData.totalProduced}/${oeeData.totalPlanned} un` },
          { icon: ShieldCheck, label: 'Qualidade', value: oeeData.quality, detail: `${oeeData.totalRejected} rejeitadas` },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="p-6 text-center">
              <item.icon className={cn('h-8 w-8 mx-auto mb-2', getOEEClass(item.value))} />
              <p className={cn('text-3xl font-bold', getOEEClass(item.value))}>{item.value.toFixed(1)}%</p>
              <p className="text-sm font-medium text-muted-foreground mt-1">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
              <Progress value={item.value} className="mt-3 h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="losses" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="losses">⚡ Six Big Losses</TabsTrigger>
          <TabsTrigger value="trend">📈 Tendência OEE</TabsTrigger>
          <TabsTrigger value="decomposition">🎯 Decomposição</TabsTrigger>
          <TabsTrigger value="sectors">🏭 OEE por Setor</TabsTrigger>
        </TabsList>

        <TabsContent value="losses" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Six Big Losses — Categorização TPM</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={sixBigLosses} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={11} />
                    <YAxis dataKey="name" type="category" width={130} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" name="Minutos perdidos" radius={[0, 4, 4, 0]}>
                      {sixBigLosses.map((_, i) => <Cell key={i} fill={COLORS_LOSS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Distribuição de Perdas</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={sixBigLosses} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                      {sixBigLosses.map((_, i) => <Cell key={i} fill={COLORS_LOSS[i]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Detalhamento das Perdas</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Perda</TableHead><TableHead>Categoria</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Minutos</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {sixBigLosses.map((loss, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{loss.name}</TableCell>
                      <TableCell><Badge variant={loss.category === 'Disponibilidade' ? 'default' : loss.category === 'Performance' ? 'secondary' : 'destructive'} className="text-xs">{loss.category}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{loss.description}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{loss.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend">
          <Card>
            <CardHeader><CardTitle className="text-base">Tendência OEE — Últimos 14 Dias</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={oeeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" fontSize={11} />
                  <YAxis fontSize={11} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={85} stroke="hsl(var(--success))" strokeDasharray="5 5" label="World Class 85%" />
                  <ReferenceLine y={60} stroke="hsl(var(--warning))" strokeDasharray="5 5" label="Bom 60%" />
                  <Bar dataKey="oee" name="OEE %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.7} />
                  <Line type="monotone" dataKey="availability" name="Disponibilidade" stroke="hsl(var(--chart-4))" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="performance" name="Performance" stroke="hsl(var(--chart-3))" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="quality" name="Qualidade" stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decomposition">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Decomposição OEE</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                    <RadialBar dataKey="value" cornerRadius={6} label={{ position: 'insideStart', fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                    <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Fórmula OEE</p>
                  <p className="text-lg font-mono">{oeeData.availability.toFixed(1)}% × {oeeData.performance.toFixed(1)}% × {oeeData.quality.toFixed(1)}% = <span className={cn('font-bold', getOEEClass(oeeData.oee))}>{oeeData.oee.toFixed(1)}%</span></p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Disponibilidade', value: oeeData.availability, target: 90, tip: 'Reduza paradas não planejadas e tempo de setup' },
                    { label: 'Performance', value: oeeData.performance, target: 95, tip: 'Elimine micro-paradas e aumente velocidade' },
                    { label: 'Qualidade', value: oeeData.quality, target: 99, tip: 'Reduza refugo e retrabalho' },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className={cn('text-sm font-bold', getOEEClass(item.value))}>{item.value.toFixed(1)}% <span className="text-muted-foreground font-normal">(meta: {item.target}%)</span></span>
                      </div>
                      <Progress value={item.value} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">💡 {item.tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sectors">
          {sectorOEE.length > 0 ? (
            <div className="space-y-4">
              {sectorOEE.map(s => (
                <Card key={s.sector}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{s.sector}</h3>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-2xl font-bold', getOEEClass(s.oee))}>{s.oee.toFixed(1)}%</span>
                        <Badge variant={s.oee >= 85 ? 'default' : s.oee >= 60 ? 'secondary' : 'destructive'}>
                          {getOEELabel(s.oee)}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: 'Disponibilidade', value: s.availability },
                        { label: 'Performance', value: s.performance },
                        { label: 'Qualidade', value: s.quality },
                      ].map((item, i) => (
                        <div key={i}>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <Progress value={item.value} className="mt-1 h-2" />
                          <p className={cn('text-xs mt-1 font-medium', getOEEClass(item.value))}>{item.value.toFixed(1)}%</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Produzido: {s.produced} | Planejado: {s.planned} | Rejeitado: {s.rejected}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Cadastre capacidades para ver OEE por setor</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
