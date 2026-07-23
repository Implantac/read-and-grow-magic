import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/ui/base/dropdown-menu';
import { Truck, MoreHorizontal, PlayCircle, CheckCircle, Info, ShoppingCart } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { statusConfig, formatDate } from './constants';

interface Props {
  loading: boolean;
  orders: any[];
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onOpenDetails: (order: any) => void;
}

export function ReceivingTable({ loading, orders, onStart, onComplete, onOpenDetails }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" /> Ordens de Recebimento
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data Prevista</TableHead>
                <TableHead>Doca</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState icon={Truck} title="Nenhum recebimento programado" description="Ordens de compra confirmadas aparecerão aqui para conferência e entrada." />
                  </TableCell>
                </TableRow>
              )}
              {orders.map((order) => {
                const cfg = statusConfig[order.status] || statusConfig.pending;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium font-mono">{order.orderNumber}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell className="tabular-nums">{formatDate(order.expectedDate)}</TableCell>
                    <TableCell>{order.dock || '-'}</TableCell>
                    <TableCell className="tabular-nums">{order.receivedItems || 0}/{order.itemsCount || 0}</TableCell>
                    <TableCell>
                      {order.notes?.includes('Gerado automaticamente') ? (
                        <Badge variant="outline" className="text-xs gap-1"><ShoppingCart className="h-3 w-3" />Compras</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {order.status === 'pending' && (
                            <DropdownMenuItem onClick={() => onStart(order.id)}>
                              <PlayCircle className="mr-2 h-4 w-4 text-primary" /> Iniciar Recebimento
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onOpenDetails(order)}>
                            <Info className="mr-2 h-4 w-4" /> Detalhes & Conferência
                          </DropdownMenuItem>
                          {order.status === 'in_progress' && (
                            <DropdownMenuItem onClick={() => onComplete(order.id)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Concluir Recebimento
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
