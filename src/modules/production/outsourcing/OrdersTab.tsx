import { EmptyState } from '@/shared/components/EmptyState';
import { Card, CardContent } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Truck, AlertTriangle, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { outsourcingStatusConfig } from '@/config/production';
import type { OutsourcingOrderRow } from '@/hooks/production/useOutsourcingOrders';

type Props = {
  search: string; setSearch: (v: string) => void;
  statusFilter: string; setStatusFilter: (v: string) => void;
  onCreate: () => void;
  filtered: OutsourcingOrderRow[];
  totalOrders: number;
  productionOrders: Array<{ id: string; order_number: string }>;
  onStatusChange: (o: OutsourcingOrderRow, s: string) => void;
  onReceive: (o: OutsourcingOrderRow) => void;
};

export function OrdersTab(p: Props) {
  return (
    <>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar OS ou fornecedor..." value={p.search} onChange={e => p.setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={p.statusFilter} onValueChange={p.setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(outsourcingStatusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={p.onCreate}>
              <Plus className="h-4 w-4 mr-1" /> Nova OS Terceirizada
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          {p.filtered.length === 0 ? (
            <EmptyState
              icon={Truck}
              title={p.totalOrders === 0 ? 'Nenhuma OS terceirizada' : 'Nenhuma OS encontrada'}
              description={p.totalOrders === 0
                ? 'Envie serviços para fornecedores externos e acompanhe prazos, custos e qualidade.'
                : 'Ajuste a busca ou o status para localizar a OS desejada.'}
              action={p.totalOrders === 0
                ? { label: 'Nova OS Terceirizada', onClick: p.onCreate, icon: Plus }
                : { label: 'Limpar filtros', onClick: () => { p.setSearch(''); p.setStatusFilter('all'); }, variant: 'outline' }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº OS</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>OP Vinculada</TableHead>
                  <TableHead>Qtde</TableHead>
                  <TableHead>Envio</TableHead>
                  <TableHead>Prev. Retorno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.filtered.map(o => {
                  const isLate = o.expected_return_date && new Date(o.expected_return_date) < new Date() && o.status !== 'returned';
                  const sc = outsourcingStatusConfig[isLate ? 'late' : o.status] || { label: o.status, color: '' };
                  const linkedOP = p.productionOrders.find(x => x.id === o.production_order_id);
                  return (
                    <TableRow key={o.id} className={cn(isLate && 'bg-destructive/5')}>
                      <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                      <TableCell>{o.supplier_name}</TableCell>
                      <TableCell className="font-mono text-xs">{linkedOP?.order_number || '-'}</TableCell>
                      <TableCell>{o.quantity_sent}</TableCell>
                      <TableCell>{format(new Date(o.sent_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {o.expected_return_date ? format(new Date(o.expected_return_date), 'dd/MM/yyyy') : '-'}
                          {isLate && <AlertTriangle className="h-3 w-3 text-destructive" />}
                        </div>
                      </TableCell>
                      <TableCell><Badge className={cn('text-xs', sc.color)}>{sc.label}</Badge></TableCell>
                      <TableCell>R$ {(o.total_cost || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {o.status === 'sent' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => p.onStatusChange(o, 'in_production')}>
                              Em Produção
                            </Button>
                          )}
                          {(o.status === 'sent' || o.status === 'in_production') && (
                            <Button size="sm" className="h-7 text-xs" onClick={() => p.onReceive(o)}>
                              Receber
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
