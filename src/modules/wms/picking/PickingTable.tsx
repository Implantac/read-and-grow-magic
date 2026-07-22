import { PackageSearch, User, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { Skeleton } from '@/ui/base/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Progress } from '@/ui/base/progress';
import { cn } from '@/lib/utils';
import type { PickingStatus } from '@/types/wms';
import { statusConfig, priorityConfig } from './constants';

interface Props {
  orders: any[];
  loading: boolean;
  onOpenDetails: (order: any) => void;
}

export function PickingTable({ orders, loading, onOpenDetails }: Props) {
  if (loading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Prioridade</TableHead>
          <TableHead>Itens</TableHead>
          <TableHead>Operador</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="p-0">
              <EmptyState
                compact
                icon={PackageSearch}
                title="Nenhuma ordem de picking encontrada"
                description="Novas ordens aparecem aqui quando pedidos são liberados para separação."
              />
            </TableCell>
          </TableRow>
        ) : orders.map((order) => {
          const status = statusConfig[order.status as PickingStatus] || statusConfig.pending;
          const priority = priorityConfig[order.priority] || priorityConfig.medium;
          return (
            <TableRow key={order.id} className="group cursor-pointer hover:bg-muted/30" onClick={() => onOpenDetails(order)}>
              <TableCell className="font-medium font-mono">{order.orderNumber}</TableCell>
              <TableCell className="max-w-[200px] truncate">{order.customerName}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", priority.color)} />
                  <span className="text-xs font-medium">{priority.label}</span>
                </span>
              </TableCell>
              <TableCell className="tabular-nums">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold">{order.pickedItems}/{order.itemsCount}</span>
                  <Progress value={(order.pickedItems / order.itemsCount) * 100} className="h-1 w-12" />
                </div>
              </TableCell>
              <TableCell>
                {order.assignedTo ? (
                  <div className="flex items-center gap-1.5 text-xs">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {order.assignedTo}
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell><Badge variant={status.variant} className="text-[10px] font-bold uppercase">{status.label}</Badge></TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
