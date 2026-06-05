import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Send, CheckCircle, Package, FileText, Loader2 } from 'lucide-react';
import { ExportButton } from '@/shared/components/ExportButton';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { formatBRL, formatDate } from '@/lib/formatters';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/ui/base/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/ui/base/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/ui/base/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/ui/base/select';
import { Badge } from '@/ui/base/badge';
import { Separator } from '@/ui/base/separator';
import { purchaseOrderStatuses } from '@/config/purchasing';
import { PurchaseOrder } from '@/types/purchasing';
import { usePurchasing } from '@/hooks/purchasing/usePurchasingQuery';
import { toast } from 'sonner';

const priorityConfig: any = {
  low: { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Média', className: 'bg-info/10 text-info' },
  high: { label: 'Alta', className: 'bg-warning/10 text-warning' },
  urgent: { label: 'Urgente', className: 'bg-destructive/10 text-destructive' },
};

export default function PurchaseOrdersPage() {
  const { orders, ordersLoading: loading } = usePurchasing();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesSearch =
      order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }), [orders, searchTerm, statusFilter, priorityFilter]);

  const stats = useMemo(() => ({
    total: orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    pending: orders.filter((o) => ['draft', 'pending_approval', 'approved'].includes(o.status)).length,
    inTransit: orders.filter((o) => ['sent', 'confirmed'].includes(o.status)).length,
    received: orders.filter((o) => o.status === 'received').length,
  }), [orders]);

  const getProgressPercentage = (order: PurchaseOrder) => {
    if (!order.items || order.items.length === 0) return 0;
    const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const receivedQty = order.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
    return totalQty > 0 ? Math.round((receivedQty / totalQty) * 100) : 0;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin" /></div>;

  return (
    <PageContainer>
      <PageHeader title="Pedidos de Compra" description="Gerencie os pedidos de compra">
        <ExportButton
          data={filteredOrders as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'number', label: 'Número' },
            { key: 'supplierName', label: 'Fornecedor' },
            { key: 'date', label: 'Data', format: (v) => formatDate(v as string) },
            { key: 'total', label: 'Total', format: (v) => formatBRL(Number(v)) },
            { key: 'status', label: 'Status' },
            { key: 'priority', label: 'Prioridade' },
          ]}
          filename="pedidos_compra"
        />
        <Button onClick={() => {}}><Plus className="mr-2 h-4 w-4" />Novo Pedido</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <KPICard title="Valor Total" value={formatBRL(stats.total)} icon={<FileText className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Pendentes" value={String(stats.pending)} icon={<Clock className="h-5 w-5" />} accentColor="warning" index={1} />
        <KPICard title="Em Trânsito" value={String(stats.inTransit)} icon={<Package className="h-5 w-5" />} accentColor="info" index={2} />
        <KPICard title="Recebidos" value={String(stats.received)} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(purchaseOrderStatuses).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.number}</TableCell>
                  <TableCell>{order.supplierName}</TableCell>
                  <TableCell>{formatDate(order.date)}</TableCell>
                  <TableCell>{formatBRL(order.total)}</TableCell>
                  <TableCell>
                    <Badge className={priorityConfig[order.priority]?.className || ''}>
                      {priorityConfig[order.priority]?.label || order.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={purchaseOrderStatuses[order.status]?.color || ''}>
                      {purchaseOrderStatuses[order.status]?.label || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedOrder(order); setIsViewOpen(true); }}><Eye className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog simplified for refactoring */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Detalhes do Pedido {selectedOrder?.number}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div><Label className="text-muted-foreground text-xs uppercase">Fornecedor</Label><p className="font-bold">{selectedOrder.supplierName}</p></div>
                 <div><Label className="text-muted-foreground text-xs uppercase">Total</Label><p className="font-bold">{formatBRL(selectedOrder.total)}</p></div>
               </div>
               <Separator />
               <Table>
                 <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Preço</TableHead></TableRow></TableHeader>
                 <TableBody>{selectedOrder.items?.map(item => (
                   <TableRow key={item.id}>
                     <TableCell>{item.productName}</TableCell>
                     <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                     <TableCell className="text-right">{formatBRL(item.unitPrice)}</TableCell>
                   </TableRow>
                 ))}</TableBody>
               </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
