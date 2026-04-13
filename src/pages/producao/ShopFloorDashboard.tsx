import { useMemo, useEffect, useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { supabase } from '@/integrations/supabase/client';
import { Users, Factory, AlertTriangle, TrendingUp, Activity, Radio } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ShopFloorDashboardPage() {
  const { entries, loading, refetch } = useTimeEntries();
  const { orders, refetch: refetchOrders } = useProductionOrders();
  const [now, setNow] = useState(new Date());
  const [realtimeActive, setRealtimeActive] = useState(false);

  // Timer for live clock
  useEffect(() => { const interval = setInterval(() => setNow(new Date()), 5000); return () => clearInterval(interval); }, []);

  // Realtime subscription for live production updates
  useEffect(() => {
    const channel = supabase
      .channel('shopfloor-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, () => { refetch(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_orders' }, () => { refetchOrders(); })
      .subscribe((status) => { setRealtimeActive(status === 'SUBSCRIBED'); });

    return () => { supabase.removeChannel(channel); };
  }, [refetch, refetchOrders]);

  const activeEntries = entries.filter(e => e.status === 'started');
  const pausedEntries = entries.filter(e => e.status === 'paused');
  const today = new Date().toDateString();
  const todayCompleted = entries.filter(e => e.status === 'completed' && new Date(e.start_time).toDateString() === today);

  const operatorStats = useMemo(() => {
    const allToday = entries.filter(e => new Date(e.start_time).toDateString() === today);
    const operators = [...new Set(allToday.map(e => e.operator))];
    return operators.map(op => {
      const opEntries = allToday.filter(e => e.operator === op);
      const completed = opEntries.filter(e => e.status === 'completed');
      const active = opEntries.find(e => e.status === 'started');
      const totalProduced = completed.reduce((s, e) => s + e.produced_quantity, 0) + (active?.produced_quantity || 0);
      const totalRejected = completed.reduce((s, e) => s + e.rejected_quantity, 0);
      const totalMinutes = completed.reduce((s, e) => { if (e.end_time) return s + differenceInMinutes(new Date(e.end_time), new Date(e.start_time)) - (e.paused_time || 0); return s; }, 0);
      const activeMinutes = active ? differenceInMinutes(now, new Date(active.start_time)) - (active.paused_time || 0) : 0;
      const allMinutes = totalMinutes + activeMinutes;
      const pcsPerHour = allMinutes > 0 ? (totalProduced / (allMinutes / 60)) : 0;
      const isActive = !!active;
      const isPaused = !!opEntries.find(e => e.status === 'paused');
      const currentOP = active?.order_number || opEntries.find(e => e.status === 'paused')?.order_number || '-';
      const currentStep = active?.operation_name || '-';
      return { operator: op, totalProduced, totalRejected, pcsPerHour, isActive, isPaused, currentOP, currentStep, allMinutes };
    }).sort((a, b) => b.pcsPerHour - a.pcsPerHour);
  }, [entries, now, today]);

  const sectorStats = useMemo(() => {
    const allToday = entries.filter(e => new Date(e.start_time).toDateString() === today);
    const sectors = [...new Set(allToday.map(e => e.work_center).filter(Boolean))];
    return sectors.map(sector => {
      const sEntries = allToday.filter(e => e.work_center === sector);
      return { sector: sector!, active: sEntries.filter(e => e.status === 'started').length, produced: sEntries.reduce((s, e) => s + e.produced_quantity, 0), rejected: sEntries.reduce((s, e) => s + e.rejected_quantity, 0) };
    });
  }, [entries, today]);

  const alerts = useMemo(() => {
    const list: { type: string; message: string; severity: 'warning' | 'error' }[] = [];
    operatorStats.forEach(op => { if (op.pcsPerHour > 0 && op.pcsPerHour < 10) list.push({ type: 'low_productivity', message: `${op.operator}: ${op.pcsPerHour.toFixed(1)} peças/h — produtividade baixa`, severity: 'warning' }); });
    pausedEntries.forEach(e => { const pausedMin = differenceInMinutes(now, new Date(e.start_time)); if (pausedMin > 30) list.push({ type: 'long_pause', message: `${e.operator} pausado há ${pausedMin}min na OP ${e.order_number}`, severity: 'error' }); });
    return list;
  }, [operatorStats, pausedEntries, now]);

  const chartData = operatorStats.slice(0, 10).map(o => ({ name: o.operator.split(' ')[0], pcsH: Number(o.pcsPerHour.toFixed(1)) }));
  const totalProducedToday = todayCompleted.reduce((s, e) => s + e.produced_quantity, 0);

  return (
    <PageContainer loading={loading}>
      <PageHeader title="🏭 Chão de Fábrica — Tempo Real" description="Monitoramento de operadores, setores e produtividade">
        <Badge variant={realtimeActive ? 'default' : 'secondary'} className="flex items-center gap-1.5">
          <Radio className={cn('h-3 w-3', realtimeActive && 'animate-pulse text-green-400')} />
          {realtimeActive ? 'Ao Vivo' : 'Conectando...'}
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Operadores Ativos" value={activeEntries.length} icon={<Users className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Pausados" value={pausedEntries.length} icon={<Activity className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Peças Hoje" value={totalProducedToday} icon={<TrendingUp className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard title="Alertas" value={alerts.length} icon={<AlertTriangle className="h-5 w-5" />} accentColor={alerts.length > 0 ? 'danger' : 'success'} index={3} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {alerts.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Alertas em Tempo Real</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div key={i} className={cn('p-3 rounded-lg text-sm', a.severity === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning')}>⚠️ {a.message}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Produtividade por Operador (peças/h)</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
                  <Bar dataKey="pcsH" radius={[4, 4, 0, 0]}>{chartData.map((_, i) => <Cell key={i} fill={i === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.4)'} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Sem dados hoje</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Factory className="h-4 w-4" /> Setores</CardTitle></CardHeader>
          <CardContent>
            {sectorStats.length > 0 ? (
              <div className="space-y-3">
                {sectorStats.map(s => (
                  <div key={s.sector} className="p-3 rounded-lg bg-muted">
                    <div className="flex justify-between items-center mb-1"><span className="font-medium">{s.sector}</span><Badge variant="outline" className="text-xs">{s.active} ativos</Badge></div>
                    <p className="text-sm text-muted-foreground">{s.produced} peças produzidas • {s.rejected} refugo</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-muted-foreground py-8">Sem atividade nos setores</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Operadores — Detalhamento</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Operador</TableHead><TableHead>Status</TableHead><TableHead>OP Atual</TableHead>
              <TableHead>Etapa</TableHead><TableHead className="text-right">Produzido</TableHead>
              <TableHead className="text-right">Refugo</TableHead><TableHead className="text-right">Peças/h</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {operatorStats.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum operador ativo hoje</TableCell></TableRow>
              ) : operatorStats.map(o => (
                <TableRow key={o.operator}>
                  <TableCell className="font-medium">{o.operator}</TableCell>
                  <TableCell><Badge variant={o.isActive ? 'default' : o.isPaused ? 'secondary' : 'outline'} className="text-xs">{o.isActive ? '▶ Produzindo' : o.isPaused ? '⏸ Pausado' : '✓ Concluído'}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{o.currentOP}</TableCell>
                  <TableCell>{o.currentStep}</TableCell>
                  <TableCell className="text-right font-medium">{o.totalProduced}</TableCell>
                  <TableCell className="text-right text-destructive">{o.totalRejected}</TableCell>
                  <TableCell className="text-right"><span className={cn('font-bold', o.pcsPerHour < 10 ? 'text-destructive' : 'text-success')}>{o.pcsPerHour.toFixed(1)}</span></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
