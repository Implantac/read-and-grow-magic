import { Button } from '@/ui/base/button';
import { EmptyState } from '@/shared/components/EmptyState';
import { Skeleton } from '@/ui/base/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Eye, FileText, Filter, Play } from 'lucide-react';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/formatters';
import { getAllowedTransitions } from '@/lib/orderFlowEngine';
import { getOrderFlowStatus } from '@/hooks/commercial/useOrderFlow';
import { OrderFlowBadge, OrderProgressBar } from './OrderFlowIndicators';

interface Props {
  isLoading: boolean;
  allOrders: any[] | undefined;
  filtered: any[];
  search: string;
  statusFilter: string;
  onClearFilters: () => void;
  onSelectOrder: (o: any) => void;
  onTransition: (o: any, targetStatus: string) => void;
  lifecyclePending: boolean;
}

export function OrderTrackingTable({
  isLoading,
  allOrders,
  filtered,
  search,
  statusFilter,
  onClearFilters,
  onSelectOrder,
  onTransition,
  lifecyclePending,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (!allOrders?.length) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhum pedido cadastrado"
        description="Crie seu primeiro pedido no módulo Comercial para acompanhar o fluxo aqui."
        action={{ label: 'Ir para Pedidos', href: '/comercial/pedidos', icon: FileText }}
      />
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={Filter}
        title="Nenhum pedido encontrado"
        description={
          search || statusFilter !== 'all'
            ? 'Ajuste os filtros ou termos de busca para ver resultados.'
            : 'Nenhum pedido corresponde aos critérios atuais.'
        }
        action={{ label: 'Limpar filtros', onClick: onClearFilters, variant: 'outline' }}
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nº Pedido</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden lg:table-cell min-w-[160px]">Progresso</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((o) => {
          const nextStatuses = getAllowedTransitions(o.status).filter((s) => s !== 'cancelled').slice(0, 2);
          return (
            <TableRow key={o.id}>
              <TableCell className="font-mono font-medium">{o.number}</TableCell>
              <TableCell>{o.client_name}</TableCell>
              <TableCell>{format(new Date(o.date), 'dd/MM/yyyy')}</TableCell>
              <TableCell>R$ {formatNumber(o.total, 2)}</TableCell>
              <TableCell><OrderFlowBadge status={o.status} /></TableCell>
              <TableCell className="hidden lg:table-cell"><OrderProgressBar status={o.status} /></TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  {nextStatuses.map((ns) => (
                    <Button
                      key={ns}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={(e) => { e.stopPropagation(); onTransition(o, ns); }}
                      disabled={lifecyclePending}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      {getOrderFlowStatus(ns).label}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); onSelectOrder(o); }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
