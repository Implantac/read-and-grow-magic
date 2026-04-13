import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useProductionCapacity } from '@/hooks/useProductionCapacity';
import { Zap, ArrowUpDown, Target, Clock, Calendar, AlertTriangle, CheckCircle, ListOrdered } from 'lucide-react';
import { differenceInDays, format, parseISO, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

type SortCriteria = 'priority_due' | 'due_date' | 'shortest_first' | 'longest_first' | 'critical_ratio';

export default function APSPage() {
  const { orders, update } = useProductionOrders();
  const { capacities } = useProductionCapacity();
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('priority_due');

  const activeOPs = orders.filter(o => ['planned', 'in_progress', 'paused'].includes(o.status));
  const totalCapPerDay = capacities.reduce((s, c) => s + (c.capacity_per_hour || 0) * 8, 0);

  // Sequencing algorithm
  const sequencedOPs = useMemo(() => {
    const priorityMap: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

    return [...activeOPs].map(o => {
      const remaining = Math.max(0, o.quantity - o.produced_quantity);
      const avgTime = o.produced_quantity > 0 && o.realized_time_minutes > 0
        ? o.realized_time_minutes / o.produced_quantity
        : o.estimated_time_minutes / Math.max(o.quantity, 1);
      const estMinutes = remaining * avgTime;
      const estDays = totalCapPerDay > 0 ? remaining / totalCapPerDay : 999;
      const dueIn = o.due_date ? differenceInDays(parseISO(o.due_date), new Date()) : 999;
      const criticalRatio = dueIn > 0 ? estDays / dueIn : 999;
      const isLate = o.due_date ? new Date() > new Date(o.due_date) : false;
      const willBeLate = dueIn < estDays;

      return { ...o, remaining, estMinutes, estDays, dueIn, criticalRatio, isLate, willBeLate, priorityNum: priorityMap[o.priority] ?? 9 };
    }).sort((a, b) => {
      switch (sortCriteria) {
        case 'due_date': return a.dueIn - b.dueIn;
        case 'shortest_first': return a.estMinutes - b.estMinutes;
        case 'longest_first': return b.estMinutes - a.estMinutes;
        case 'critical_ratio': return b.criticalRatio - a.criticalRatio; // higher CR = more critical
        case 'priority_due':
        default:
          // Late orders first, then by priority, then by due date
          if (a.isLate !== b.isLate) return a.isLate ? -1 : 1;
          if (a.willBeLate !== b.willBeLate) return a.willBeLate ? -1 : 1;
          const pDiff = a.priorityNum - b.priorityNum;
          if (pDiff !== 0) return pDiff;
          return a.dueIn - b.dueIn;
      }
    });
  }, [activeOPs, sortCriteria, totalCapPerDay]);

  const lateCount = sequencedOPs.filter(o => o.isLate).length;
  const willBeLateCount = sequencedOPs.filter(o => o.willBeLate && !o.isLate).length;
  const onTrack = sequencedOPs.filter(o => !o.isLate && !o.willBeLate).length;

  // Cumulative timeline
  let cumulativeHours = 0;
  const timeline = sequencedOPs.map((o, idx) => {
    const hours = o.estMinutes / 60;
    cumulativeHours += hours;
    const startDate = addDays(new Date(), idx === 0 ? 0 : Math.ceil((cumulativeHours - hours) / 8));
    const endDate = addDays(new Date(), Math.ceil(cumulativeHours / 8));
    return { ...o, seq: idx + 1, cumHours: cumulativeHours, startDate, endDate };
  });

  const handleApplySequence = async () => {
    // Update priority based on sequence
    for (let i = 0; i < Math.min(timeline.length, 5); i++) {
      const op = timeline[i];
      if (op.priority !== 'urgent' && (op.isLate || op.willBeLate)) {
        await update(op.id, { priority: 'urgent' });
      }
    }
    toast.success(`Sequenciamento aplicado — ${timeline.length} OPs priorizadas`);
  };

  return (
    <PageContainer>
      <PageHeader title="🚀 APS — Planejamento Avançado" description="Sequenciamento automático, otimização de recursos e priorização inteligente">
        <Button onClick={handleApplySequence} disabled={timeline.length === 0}>
          <Zap className="h-4 w-4 mr-2" /> Aplicar Sequenciamento
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="OPs para Sequenciar" value={activeOPs.length} icon={<ListOrdered className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="No Prazo" value={onTrack} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Risco de Atraso" value={willBeLateCount} icon={<Clock className="h-5 w-5" />} accentColor="warning" index={2} />
        <KPICard title="Atrasadas" value={lateCount} icon={<AlertTriangle className="h-5 w-5" />} accentColor="danger" index={3} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2"><ArrowUpDown className="h-4 w-4" /> Sequenciamento de Produção</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Algoritmo:</span>
              <Select value={sortCriteria} onValueChange={v => setSortCriteria(v as SortCriteria)}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority_due">🎯 Prioridade + Prazo (Recomendado)</SelectItem>
                  <SelectItem value="due_date">📅 EDD — Menor Prazo</SelectItem>
                  <SelectItem value="shortest_first">⚡ SPT — Menor Tempo</SelectItem>
                  <SelectItem value="longest_first">🔄 LPT — Maior Tempo</SelectItem>
                  <SelectItem value="critical_ratio">📊 CR — Razão Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>OP</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead className="text-right">Pendente</TableHead>
              <TableHead className="text-right">Est. (h)</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Previsão Início</TableHead>
              <TableHead>Previsão Fim</TableHead>
              <TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {timeline.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhuma OP para sequenciar</TableCell></TableRow>
              ) : timeline.map(o => (
                <TableRow key={o.id} className={cn(o.isLate && 'bg-destructive/5', o.willBeLate && !o.isLate && 'bg-warning/5')}>
                  <TableCell className="font-bold text-center">{o.seq}</TableCell>
                  <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                  <TableCell className="font-medium max-w-[150px] truncate">{o.product_name}</TableCell>
                  <TableCell>
                    <Badge variant={o.priority === 'urgent' ? 'destructive' : o.priority === 'high' ? 'default' : 'outline'} className="text-xs">
                      {o.priority === 'urgent' ? '🔴' : o.priority === 'high' ? '🟠' : o.priority === 'medium' ? '🔵' : '⚪'} {o.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{o.remaining}</TableCell>
                  <TableCell className="text-right font-mono">{(o.estMinutes / 60).toFixed(1)}</TableCell>
                  <TableCell className={cn(o.isLate && 'text-destructive font-medium')}>{o.due_date ? format(new Date(o.due_date), 'dd/MM') : '-'}</TableCell>
                  <TableCell>{format(o.startDate, 'dd/MM')}</TableCell>
                  <TableCell className={cn(o.willBeLate && 'text-warning font-medium')}>{format(o.endDate, 'dd/MM')}</TableCell>
                  <TableCell>
                    {o.isLate ? (
                      <Badge variant="destructive" className="text-xs">⚠ Atrasada</Badge>
                    ) : o.willBeLate ? (
                      <Badge variant="secondary" className="text-xs">⏳ Risco</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-success">✓ OK</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <Calendar className="h-8 w-8 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Previsão Final do Backlog</p>
            <p className="text-3xl font-extrabold">{timeline.length > 0 ? format(timeline[timeline.length - 1].endDate, 'dd/MM/yyyy') : '-'}</p>
            <p className="text-xs text-muted-foreground">{cumulativeHours.toFixed(0)}h de produção acumulada</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <Target className="h-8 w-8 mx-auto text-success" />
            <p className="text-sm text-muted-foreground">Taxa de Cumprimento</p>
            <p className={cn('text-5xl font-extrabold', onTrack / Math.max(sequencedOPs.length, 1) >= 0.8 ? 'text-success' : 'text-warning')}>
              {sequencedOPs.length > 0 ? ((onTrack / sequencedOPs.length) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">OPs no prazo / Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <Zap className="h-8 w-8 mx-auto text-warning" />
            <p className="text-sm text-muted-foreground">Capacidade Diária</p>
            <p className="text-3xl font-extrabold">{totalCapPerDay.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">unidades/dia ({capacities.length} recursos)</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
