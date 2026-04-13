import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useProductionCapacity } from '@/hooks/useProductionCapacity';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { Cpu, Zap, Clock, Package, AlertTriangle, Play, TrendingUp } from 'lucide-react';
import { differenceInDays, addDays, format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export default function DigitalTwinPage() {
  const { orders } = useProductionOrders();
  const { capacities } = useProductionCapacity();
  const { entries } = useTimeEntries();

  const [simNewOrders, setSimNewOrders] = useState(0);
  const [simQtyPerOrder, setSimQtyPerOrder] = useState(100);
  const [simTimePerUnit, setSimTimePerUnit] = useState(5); // min

  // Current state
  const activeOPs = orders.filter(o => ['planned', 'in_progress', 'paused'].includes(o.status));
  const totalPendingQty = activeOPs.reduce((s, o) => s + Math.max(0, o.quantity - o.produced_quantity), 0);
  const totalPendingMinutes = activeOPs.reduce((s, o) => {
    const remaining = Math.max(0, o.quantity - o.produced_quantity);
    const avgTimePerUnit = o.produced_quantity > 0 && o.realized_time_minutes > 0
      ? o.realized_time_minutes / o.produced_quantity
      : o.estimated_time_minutes / Math.max(o.quantity, 1);
    return s + remaining * avgTimePerUnit;
  }, 0);

  // Capacity calculation
  const totalCapacityPerHour = capacities.reduce((s, c) => s + (c.capacity_per_hour || 0), 0);
  const totalCapacityPerDay = totalCapacityPerHour * 8; // 8h shift
  const daysToComplete = totalCapacityPerDay > 0 ? Math.ceil(totalPendingQty / totalCapacityPerDay) : 0;

  // Simulation
  const simTotalNewQty = simNewOrders * simQtyPerOrder;
  const simTotalNewMinutes = simTotalNewQty * simTimePerUnit;
  const simTotalPendingQty = totalPendingQty + simTotalNewQty;
  const simTotalPendingMinutes = totalPendingMinutes + simTotalNewMinutes;
  const simDaysToComplete = totalCapacityPerDay > 0 ? Math.ceil(simTotalPendingQty / totalCapacityPerDay) : 0;
  const simCompletionDate = addDays(new Date(), simDaysToComplete);
  const capacityUtilization = totalCapacityPerDay > 0 ? Math.min((simTotalPendingQty / (totalCapacityPerDay * 30)) * 100, 100) : 0;

  // Impact analysis by sector
  const sectorLoad = useMemo(() => {
    const sectors: Record<string, { current: number; capacity: number }> = {};
    activeOPs.forEach(o => {
      const sector = o.sector || o.work_center || 'Geral';
      if (!sectors[sector]) sectors[sector] = { current: 0, capacity: 0 };
      sectors[sector].current += Math.max(0, o.quantity - o.produced_quantity);
    });
    capacities.forEach(c => {
      const sector = c.sector || 'Geral';
      if (!sectors[sector]) sectors[sector] = { current: 0, capacity: 0 };
      sectors[sector].capacity += (c.capacity_per_hour || 0) * 8 * 22; // monthly
    });
    return Object.entries(sectors).map(([sector, v]) => ({
      sector,
      current: v.current,
      simulated: v.current + Math.round(simTotalNewQty / Math.max(Object.keys(sectors).length, 1)),
      capacity: v.capacity,
      loadPct: v.capacity > 0 ? (v.current / v.capacity) * 100 : 0,
      simLoadPct: v.capacity > 0 ? ((v.current + Math.round(simTotalNewQty / Math.max(Object.keys(sectors).length, 1))) / v.capacity) * 100 : 0,
    }));
  }, [activeOPs, capacities, simTotalNewQty]);

  const comparisonData = [
    { label: 'Atual', qty: totalPendingQty, days: daysToComplete, minutes: totalPendingMinutes },
    { label: 'Simulado', qty: simTotalPendingQty, days: simDaysToComplete, minutes: simTotalPendingMinutes },
  ];

  return (
    <PageContainer>
      <PageHeader title="🔮 Digital Twin — Simulação" description="Simule o impacto de novos pedidos na capacidade produtiva" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="OPs Ativas" value={activeOPs.length} icon={<Package className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Peças Pendentes" value={totalPendingQty.toLocaleString('pt-BR')} icon={<Clock className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Capacidade/Dia" value={totalCapacityPerDay.toLocaleString('pt-BR')} icon={<Zap className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Dias p/ Concluir" value={daysToComplete} icon={<TrendingUp className="h-5 w-5" />} accentColor={daysToComplete > 15 ? 'danger' : 'primary'} index={3} />
      </div>

      <Tabs defaultValue="simulator" className="space-y-4">
        <TabsList>
          <TabsTrigger value="simulator">Simulador</TabsTrigger>
          <TabsTrigger value="capacity">Carga por Setor</TabsTrigger>
          <TabsTrigger value="timeline">Previsão de Entrega</TabsTrigger>
        </TabsList>

        <TabsContent value="simulator" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4" /> Configurar Simulação</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Novos Pedidos</label>
                  <Input type="number" min={0} value={simNewOrders} onChange={e => setSimNewOrders(Number(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Qtd por Pedido</label>
                  <Input type="number" min={1} value={simQtyPerOrder} onChange={e => setSimQtyPerOrder(Number(e.target.value))} className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Tempo/Unidade (min)</label>
                  <Input type="number" min={0.1} step={0.1} value={simTimePerUnit} onChange={e => setSimTimePerUnit(Number(e.target.value))} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2"><CardTitle className="text-base">📊 Cenário Atual</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Peças pendentes</span><span className="font-bold">{totalPendingQty.toLocaleString('pt-BR')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tempo estimado</span><span className="font-bold">{(totalPendingMinutes / 60).toFixed(0)}h</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dias para concluir</span><span className="font-bold">{daysToComplete} dias</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Previsão de conclusão</span><span className="font-bold">{format(addDays(new Date(), daysToComplete), 'dd/MM/yyyy')}</span></div>
              </CardContent>
            </Card>

            <Card className={cn('border-2', simNewOrders > 0 ? 'border-primary' : 'border-border')}>
              <CardHeader className="pb-2"><CardTitle className="text-base">🔮 Cenário Simulado</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Peças pendentes</span><span className="font-bold">{simTotalPendingQty.toLocaleString('pt-BR')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tempo estimado</span><span className="font-bold">{(simTotalPendingMinutes / 60).toFixed(0)}h</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dias para concluir</span><span className={cn('font-bold', simDaysToComplete > daysToComplete + 5 ? 'text-destructive' : '')}>{simDaysToComplete} dias</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Previsão de conclusão</span><span className="font-bold">{format(simCompletionDate, 'dd/MM/yyyy')}</span></div>
                {simNewOrders > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between"><span className="text-muted-foreground">Impacto</span><span className={cn('font-bold', simDaysToComplete - daysToComplete > 0 ? 'text-warning' : 'text-success')}>+{simDaysToComplete - daysToComplete} dias</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Utilização Mensal</span><span className="font-bold">{capacityUtilization.toFixed(0)}%</span></div>
                    <Progress value={capacityUtilization} className="h-2 mt-1" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {simNewOrders > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Comparativo</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="qty" name="Peças" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="days" name="Dias" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="capacity" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Carga por Setor</CardTitle></CardHeader>
            <CardContent>
              {sectorLoad.length > 0 ? (
                <div className="space-y-4">
                  {sectorLoad.map(s => (
                    <div key={s.sector} className="p-4 rounded-lg bg-muted space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{s.sector}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">Atual: {s.loadPct.toFixed(0)}%</Badge>
                          {simNewOrders > 0 && <Badge variant={s.simLoadPct > 90 ? 'destructive' : 'default'} className="text-xs">Simulado: {s.simLoadPct.toFixed(0)}%</Badge>}
                        </div>
                      </div>
                      <Progress value={simNewOrders > 0 ? s.simLoadPct : s.loadPct} className={cn('h-3', (simNewOrders > 0 ? s.simLoadPct : s.loadPct) > 90 && '[&>div]:bg-destructive')} />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Demanda: {(simNewOrders > 0 ? s.simulated : s.current).toLocaleString('pt-BR')} un</span>
                        <span>Capacidade: {s.capacity.toLocaleString('pt-BR')} un/mês</span>
                      </div>
                      {(simNewOrders > 0 ? s.simLoadPct : s.loadPct) > 90 && (
                        <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Gargalo detectado — capacidade insuficiente</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-muted-foreground py-8">Cadastre capacidades para simular carga</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Previsão de Entrega das OPs Ativas</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>OP</TableHead><TableHead>Produto</TableHead><TableHead className="text-right">Pendente</TableHead>
                  <TableHead>Prazo</TableHead><TableHead>Previsão</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {activeOPs.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sem OPs ativas</TableCell></TableRow>
                  ) : activeOPs.slice(0, 20).map(o => {
                    const remaining = Math.max(0, o.quantity - o.produced_quantity);
                    const avgTime = o.produced_quantity > 0 && o.realized_time_minutes > 0
                      ? o.realized_time_minutes / o.produced_quantity
                      : o.estimated_time_minutes / Math.max(o.quantity, 1);
                    const estDays = totalCapacityPerDay > 0 ? Math.ceil(remaining / totalCapacityPerDay) : 0;
                    const estDate = addDays(new Date(), estDays);
                    const isLate = o.due_date ? estDate > new Date(o.due_date) : false;
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                        <TableCell className="font-medium">{o.product_name}</TableCell>
                        <TableCell className="text-right">{remaining}</TableCell>
                        <TableCell>{o.due_date ? format(new Date(o.due_date), 'dd/MM') : '-'}</TableCell>
                        <TableCell className={cn(isLate && 'text-destructive font-medium')}>{format(estDate, 'dd/MM')}</TableCell>
                        <TableCell>
                          <Badge variant={isLate ? 'destructive' : 'default'} className="text-xs">
                            {isLate ? '⚠ Atraso previsto' : '✓ No prazo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
