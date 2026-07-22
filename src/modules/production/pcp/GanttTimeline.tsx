import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/base/tooltip';
import { EmptyState } from '@/shared/components/EmptyState';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO, addDays, startOfDay, max as dateMax, min as dateMin } from 'date-fns';
import { GanttChart } from 'lucide-react';

export function GanttTimeline({ orders }: { orders: any[] }) {
  const activeOPs = useMemo(() => {
    return orders
      .filter(o => ['planned', 'in_progress', 'paused'].includes(o.status) && o.due_date)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 25);
  }, [orders]);

  const ganttData = useMemo(() => {
    if (activeOPs.length === 0) return { rows: [], days: [], rangeStart: new Date(), totalDays: 0 };

    const today = startOfDay(new Date());
    const allDates = activeOPs.flatMap(o => {
      const start = o.start_date ? startOfDay(parseISO(o.start_date)) : today;
      const end = startOfDay(parseISO(o.due_date));
      return [start, end];
    });
    const rangeStart = dateMin(allDates.concat(today));
    const rangeEnd = addDays(dateMax(allDates), 1);
    const totalDays = Math.max(differenceInDays(rangeEnd, rangeStart), 7);

    const days = Array.from({ length: totalDays }, (_, i) => {
      const d = addDays(rangeStart, i);
      return { date: d, label: format(d, 'dd/MM'), isToday: format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') };
    });

    const rows = activeOPs.map(o => {
      const start = o.start_date ? startOfDay(parseISO(o.start_date)) : today;
      const end = startOfDay(parseISO(o.due_date));
      const startOffset = Math.max(0, differenceInDays(start, rangeStart));
      const duration = Math.max(1, differenceInDays(end, start) + 1);
      const pct = o.quantity > 0 ? (o.produced_quantity / o.quantity) * 100 : 0;
      const isLate = differenceInDays(today, end) > 0;
      return { ...o, startOffset, duration, pct, isLate };
    });

    return { rows, days, rangeStart, totalDays };
  }, [activeOPs]);

  if (activeOPs.length === 0) {
    return <EmptyState icon={GanttChart} title="Nenhuma OP ativa com prazo definido" description="Ordens de produção em andamento com datas aparecerão no Gantt." />;
  }

  const statusColors: Record<string, string> = {
    planned: 'bg-blue-500',
    in_progress: 'bg-primary',
    paused: 'bg-warning',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GanttChart className="h-5 w-5" /> Timeline de Produção
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="flex border-b pb-1 mb-2">
            <div className="w-48 flex-shrink-0 text-xs font-medium text-muted-foreground">OP / Produto</div>
            <div className="flex-1 flex">
              {ganttData.days.map((d, i) => (
                <div key={i} className={cn('flex-1 text-center text-[10px]', d.isToday && 'font-bold text-primary')}>
                  {d.label}
                </div>
              ))}
            </div>
          </div>

          {ganttData.rows.map(row => (
            <TooltipProvider key={row.id}>
              <div className="flex items-center h-8 border-b border-border/30 hover:bg-muted/30">
                <div className="w-48 flex-shrink-0 text-xs truncate pr-2">
                  <span className="font-mono font-medium">{row.order_number?.slice(-8)}</span>
                  <span className="text-muted-foreground ml-1">{row.product_name?.slice(0, 12)}</span>
                </div>
                <div className="flex-1 relative flex">
                  {ganttData.days.map((d, i) => (
                    <div key={i} className={cn('flex-1 border-r border-border/10', d.isToday && 'bg-primary/5')} />
                  ))}
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'absolute top-1 h-6 rounded-sm flex items-center overflow-hidden cursor-pointer transition-opacity hover:opacity-90',
                          row.isLate ? 'bg-destructive/80' : statusColors[row.status] || 'bg-muted',
                        )}
                        style={{
                          left: `${(row.startOffset / ganttData.totalDays) * 100}%`,
                          width: `${Math.max((row.duration / ganttData.totalDays) * 100, 2)}%`,
                        }}
                      >
                        <div
                          className="absolute inset-0 bg-white/20"
                          style={{ width: `${row.pct}%` }}
                        />
                        <span className="relative z-10 text-[10px] text-white font-medium px-1 truncate">
                          {row.pct.toFixed(0)}%
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs space-y-1">
                        <p className="font-medium">{row.order_number} — {row.product_name}</p>
                        <p>Progresso: {row.pct.toFixed(0)}% ({row.produced_quantity}/{row.quantity})</p>
                        <p>Prazo: {format(parseISO(row.due_date), 'dd/MM/yyyy')}</p>
                        {row.isLate && <p className="text-destructive font-bold">⚠ ATRASADA</p>}
                      </div>
                    </TooltipContent>
                  </UITooltip>
                </div>
              </div>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
