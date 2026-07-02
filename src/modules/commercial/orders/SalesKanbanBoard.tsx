import { ArrowRight, Eye, XCircle } from 'lucide-react';
import { Card } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { ScrollArea, ScrollBar } from '@/ui/base/scroll-area';
import { formatBRL, formatDate } from '@/lib/formatters';
import type { DbOrder } from '@/hooks/commercial/useOrders';
import { statusFlow, statusSteps } from './constants';
import { MarginBadge } from './MarginBadge';

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  processing: 'Processando',
  separated: 'Separado',
  invoiced: 'Faturado',
  shipped: 'Enviado',
  delivered: 'Entregue',
};

const priorityColor: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-500/10 text-blue-500',
  high: 'bg-orange-500/10 text-orange-500',
  urgent: 'bg-destructive/10 text-destructive',
};

interface Props {
  orders: DbOrder[];
  onView: (order: DbOrder) => void;
  onAdvance: (order: DbOrder) => void;
  onAskCancel: (order: DbOrder) => void;
  isAdvancePending?: boolean;
}

export function SalesKanbanBoard({ orders, onView, onAdvance, onAskCancel, isAdvancePending }: Props) {
  const grouped = statusSteps.reduce<Record<string, DbOrder[]>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s);
    return acc;
  }, {});

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-4 pb-4">
        {statusSteps.map((status) => {
          const list = grouped[status] || [];
          const total = list.reduce((sum, o) => sum + Number(o.total || 0), 0);
          return (
            <div key={status} className="min-w-[280px] max-w-[280px] flex-shrink-0">
              <div className="mb-3 flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {statusLabels[status]}
                  </p>
                  <p className="text-sm font-bold">{list.length} pedido{list.length === 1 ? '' : 's'}</p>
                </div>
                <p className="text-xs font-medium text-primary">{formatBRL(total)}</p>
              </div>

              <div className="space-y-2">
                {list.length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Sem pedidos
                  </div>
                )}
                {list.map((order) => {
                  const next = statusFlow[order.status];
                  return (
                    <Card key={order.id} className="space-y-2 p-3 transition hover:shadow-md">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{order.number}</p>
                          <p className="truncate text-xs text-muted-foreground">{order.client_name}</p>
                        </div>
                        <Badge className={`${priorityColor[order.priority] || ''} text-[10px]`} variant="outline">
                          {order.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{formatDate(order.date)}</span>
                        <span className="font-semibold">{formatBRL(order.total)}</span>
                      </div>
                      <div className="flex items-center justify-end">
                        <MarginBadge value={order.estimated_margin_pct} />
                      </div>
                      <div className="flex gap-1 pt-1">
                        <Button size="sm" variant="ghost" className="h-7 flex-1 gap-1 px-2 text-xs" onClick={() => onView(order)}>
                          <Eye className="h-3 w-3" /> Ver
                        </Button>
                        {next && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 flex-1 gap-1 px-2 text-xs"
                            disabled={isAdvancePending}
                            onClick={() => onAdvance(order)}
                          >
                            <ArrowRight className="h-3 w-3" /> Avançar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => onAskCancel(order)}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
