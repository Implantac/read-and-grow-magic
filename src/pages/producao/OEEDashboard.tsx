import { useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useProductionMachines } from '@/hooks/useProductionMachines';
import { useProductionCapacity } from '@/hooks/useProductionCapacity';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { Gauge, Activity, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadialBarChart, RadialBar, Legend } from 'recharts';

export default function OEEDashboard() {
  const { orders } = useProductionOrders();
  const { machines } = useProductionMachines();
  const { capacities } = useProductionCapacity();
  const { entries: timeEntries } = useTimeEntries();

  const oeeData = useMemo(() => {
    // Availability: (Running Time / Planned Production Time) × 100
    const totalMachines = machines.filter(m => m.active).length || 1;
    const runningMachines = machines.filter(m => m.status === 'running').length;
    const availability = (runningMachines / totalMachines) * 100;

    // Performance: (Actual Output / Theoretical Max Output) × 100
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalProduced = completedOrders.reduce((s, o) => s + o.produced_quantity, 0);
    const totalPlanned = completedOrders.reduce((s, o) => s + o.quantity, 0) || 1;
    const performance = Math.min((totalProduced / totalPlanned) * 100, 100);

    // Quality: (Good Units / Total Units) × 100
    const totalRejected = completedOrders.reduce((s, o) => s + o.rejected_quantity, 0);
    const quality = totalProduced > 0 ? ((totalProduced - totalRejected) / totalProduced) * 100 : 100;

    // OEE = Availability × Performance × Quality / 10000
    const oee = (availability * performance * quality) / 10000;

    return { availability, performance, quality, oee };
  }, [orders, machines]);

  const getOEEClass = (value: number) => {
    if (value >= 85) return 'text-green-500';
    if (value >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getOEELabel = (value: number) => {
    if (value >= 85) return 'World Class';
    if (value >= 60) return 'Bom';
    if (value >= 40) return 'Médio';
    return 'Baixo';
  };

  // Per-sector OEE breakdown
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

      return { sector, availability: avail, performance: perf, quality: qual, oee, produced, planned };
    });
  }, [capacities, orders]);

  const radialData = [
    { name: 'OEE', value: oeeData.oee, fill: 'hsl(var(--primary))' },
    { name: 'Qualidade', value: oeeData.quality, fill: 'hsl(var(--chart-2))' },
    { name: 'Performance', value: oeeData.performance, fill: 'hsl(var(--chart-3))' },
    { name: 'Disponibilidade', value: oeeData.availability, fill: 'hsl(var(--chart-4))' },
  ];

  const lossBreakdown = [
    { name: 'Parada Planejada', value: 100 - oeeData.availability, fill: 'hsl(var(--chart-1))' },
    { name: 'Perda Velocidade', value: 100 - oeeData.performance, fill: 'hsl(var(--chart-3))' },
    { name: 'Refugo/Retrabalho', value: 100 - oeeData.quality, fill: 'hsl(var(--destructive))' },
    { name: 'Produtivo', value: oeeData.oee, fill: 'hsl(var(--chart-2))' },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="📊 OEE — Overall Equipment Effectiveness"
        description="Disponibilidade × Performance × Qualidade = Eficiência Global"
      />

      {/* Main OEE Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="md:col-span-1 border-2">
          <CardContent className="p-6 text-center">
            <Gauge className={`h-10 w-10 mx-auto mb-2 ${getOEEClass(oeeData.oee)}`} />
            <p className={`text-5xl font-bold ${getOEEClass(oeeData.oee)}`}>{oeeData.oee.toFixed(1)}%</p>
            <p className="text-lg font-medium mt-1">OEE Global</p>
            <Badge className="mt-2" variant={oeeData.oee >= 85 ? 'default' : oeeData.oee >= 60 ? 'secondary' : 'destructive'}>
              {getOEELabel(oeeData.oee)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Activity className={`h-8 w-8 mx-auto mb-2 ${getOEEClass(oeeData.availability)}`} />
            <p className={`text-3xl font-bold ${getOEEClass(oeeData.availability)}`}>{oeeData.availability.toFixed(1)}%</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Disponibilidade</p>
            <p className="text-xs text-muted-foreground mt-2">
              {machines.filter(m => m.status === 'running').length} de {machines.filter(m => m.active).length} máquinas
            </p>
            <Progress value={oeeData.availability} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className={`h-8 w-8 mx-auto mb-2 ${getOEEClass(oeeData.performance)}`} />
            <p className={`text-3xl font-bold ${getOEEClass(oeeData.performance)}`}>{oeeData.performance.toFixed(1)}%</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Performance</p>
            <p className="text-xs text-muted-foreground mt-2">Produzido vs Planejado</p>
            <Progress value={oeeData.performance} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <ShieldCheck className={`h-8 w-8 mx-auto mb-2 ${getOEEClass(oeeData.quality)}`} />
            <p className={`text-3xl font-bold ${getOEEClass(oeeData.quality)}`}>{oeeData.quality.toFixed(1)}%</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Qualidade</p>
            <p className="text-xs text-muted-foreground mt-2">Peças boas / total</p>
            <Progress value={oeeData.quality} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Radial Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Decomposição OEE</CardTitle>
          </CardHeader>
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

        {/* Loss Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Perdas × Tempo Produtivo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={lossBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}>
                  {lossBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Per Sector OEE */}
      {sectorOEE.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">OEE por Setor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sectorOEE.map(s => (
                <div key={s.sector} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{s.sector}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${getOEEClass(s.oee)}`}>{s.oee.toFixed(1)}%</span>
                      <Badge variant={s.oee >= 85 ? 'default' : s.oee >= 60 ? 'secondary' : 'destructive'}>
                        {getOEELabel(s.oee)}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Disponibilidade</p>
                      <Progress value={s.availability} className="mt-1 h-2" />
                      <p className="text-xs mt-1">{s.availability.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Performance</p>
                      <Progress value={s.performance} className="mt-1 h-2" />
                      <p className="text-xs mt-1">{s.performance.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Qualidade</p>
                      <Progress value={s.quality} className="mt-1 h-2" />
                      <p className="text-xs mt-1">{s.quality.toFixed(1)}%</p>
                    </div>
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
