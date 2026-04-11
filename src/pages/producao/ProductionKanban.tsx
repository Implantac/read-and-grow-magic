import { useState, useMemo } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { productionStatusConfig, priorityConfig } from '@/config/production';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Clock, Factory, CheckCircle, Pause, AlertTriangle, QrCode } from 'lucide-react';
import { QRCodeOPButton } from '@/components/producao/QRCodeOP';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

const KANBAN_COLUMNS = [
  { key: 'planned', label: 'Fila / Planejada', icon: Clock, color: 'border-blue-400' },
  { key: 'in_progress', label: 'Em Produção', icon: Factory, color: 'border-yellow-400' },
  { key: 'paused', label: 'Pausada', icon: Pause, color: 'border-orange-400' },
  { key: 'completed', label: 'Finalizada', icon: CheckCircle, color: 'border-green-400' },
];

export default function ProductionKanban() {
  const { orders, loading, update } = useProductionOrders();

  const columns = useMemo(() => {
    return KANBAN_COLUMNS.map(col => ({
      ...col,
      items: orders.filter(o => o.status === col.key)
        .sort((a, b) => {
          const pMap: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          return (pMap[a.priority] ?? 9) - (pMap[b.priority] ?? 9);
        }),
    }));
  }, [orders]);

  const moveOrder = async (orderId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'in_progress') updates.start_date = new Date().toISOString();
    if (newStatus === 'completed') updates.completed_date = new Date().toISOString();
    await update(orderId, updates);
  };

  if (loading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64 mb-4" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96" />)}</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Kanban de Produção" description="Visão do fluxo produtivo em tempo real" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map(col => {
          const Icon = col.icon;
          return (
            <div key={col.key} className="space-y-3">
              <div className={cn('flex items-center gap-2 p-3 rounded-lg border-t-4 bg-card', col.color)}>
                <Icon className="h-5 w-5" />
                <span className="font-semibold">{col.label}</span>
                <Badge variant="secondary" className="ml-auto">{col.items.length}</Badge>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {col.items.map(order => {
                  const progress = order.quantity > 0 ? (order.produced_quantity / order.quantity) * 100 : 0;
                  const isLate = order.due_date && differenceInDays(new Date(), parseISO(order.due_date)) > 0 && order.status !== 'completed';
                  const pCfg = priorityConfig[order.priority] || { label: order.priority, color: 'bg-gray-100 text-gray-800' };

                  return (
                    <Card key={order.id} className={cn('shadow-sm hover:shadow-md transition-shadow', isLate && 'border-destructive')}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
                          {isLate && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        </div>
                        <p className="font-medium text-sm leading-tight">{order.product_name}</p>
                        {order.client_name && <p className="text-xs text-muted-foreground">{order.client_name}</p>}
                        <div className="flex items-center gap-2">
                          <Badge className={cn('text-[10px]', pCfg.color)}>{pCfg.label}</Badge>
                          {order.color && <Badge variant="outline" className="text-[10px]">{order.color}</Badge>}
                          {order.size_grid && <Badge variant="outline" className="text-[10px]">{order.size_grid}</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.produced_quantity}/{order.quantity} {order.unit} ({progress.toFixed(0)}%)
                        </div>
                        <Progress value={progress} className="h-1.5" />
                        {order.due_date && (
                          <p className={cn('text-xs', isLate ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                            Entrega: {format(parseISO(order.due_date), 'dd/MM')}
                          </p>
                        )}

                        <div className="flex gap-1 pt-1 flex-wrap">
                          <QRCodeOPButton orderNumber={order.order_number} orderId={order.id} productName={order.product_name} batchCode={order.batch_code || undefined} />
                          {col.key === 'planned' && (
                            <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => moveOrder(order.id, 'in_progress')}>
                              <ArrowRight className="h-3 w-3 mr-1" /> Iniciar
                            </Button>
                          )}
                          {col.key === 'in_progress' && (
                            <>
                              <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => moveOrder(order.id, 'paused')}>
                                <Pause className="h-3 w-3 mr-1" /> Pausar
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => moveOrder(order.id, 'completed')}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Finalizar
                              </Button>
                            </>
                          )}
                          {col.key === 'paused' && (
                            <Button size="sm" variant="outline" className="text-xs h-7 flex-1" onClick={() => moveOrder(order.id, 'in_progress')}>
                              <ArrowRight className="h-3 w-3 mr-1" /> Retomar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {col.items.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-lg">
                    Nenhuma OP
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
