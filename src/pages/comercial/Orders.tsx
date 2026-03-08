import { useState } from 'react';
import { Plus, Eye, MoreHorizontal, FileText, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { ExportButton } from '@/components/shared/ExportButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AdvancedFilters, type FilterField } from '@/components/shared/AdvancedFilters';
import { getPaymentMethodLabel, getOrderStatusLabel } from '@/data/commercialMockData';
import { useOrders, useUpdateOrderStatus, type DbOrder } from '@/hooks/useOrders';

const filterFields: FilterField[] = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'pending', label: 'Pendente' }, { value: 'confirmed', label: 'Confirmado' },
    { value: 'processing', label: 'Processando' }, { value: 'separated', label: 'Separado' },
    { value: 'invoiced', label: 'Faturado' }, { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregue' }, { value: 'cancelled', label: 'Cancelado' },
  ]},
  { key: 'priority', label: 'Prioridade', type: 'select', options: [
    { value: 'low', label: 'Baixa' }, { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' }, { value: 'urgent', label: 'Urgente' },
  ]},
  { key: 'paymentMethod', label: 'Forma de Pagamento', type: 'select', options: [
    { value: 'cash', label: 'Dinheiro' }, { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' }, { value: 'pix', label: 'PIX' },
    { value: 'boleto', label: 'Boleto' }, { value: 'transfer', label: 'Transferência' },
  ]},
  { key: 'startDate', label: 'Data Inicial', type: 'date' },
  { key: 'endDate', label: 'Data Final', type: 'date' },
];

const statusFlow: Record<string, string | null> = {
  pending: 'confirmed', confirmed: 'processing', processing: 'separated',
  separated: 'invoiced', invoiced: 'shipped', shipped: 'delivered',
  delivered: null, cancelled: null,
};

export default function OrdersPage() {
  const { toast } = useToast();
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);

  const filteredOrders = orders.filter((order) => {
    if (filters.status && order.status !== filters.status) return false;
    if (filters.priority && order.priority !== filters.priority) return false;
    if (filters.paymentMethod && order.payment_method !== filters.paymentMethod) return false;
    if (filters.startDate && new Date(order.date) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(order.date) > new Date(filters.endDate)) return false;
    return true;
  });

  const columns: Column<DbOrder>[] = [
    { key: 'number', label: 'Pedido', sortable: true },
    { key: 'client_name', label: 'Cliente', sortable: true },
    { key: 'date', label: 'Data', sortable: true, render: (v) => format(new Date(v as string), 'dd/MM/yyyy', { locale: ptBR }) },
    { key: 'delivery_date', label: 'Entrega', render: (v) => v ? format(new Date(v as string), 'dd/MM/yyyy', { locale: ptBR }) : '-' },
    { key: 'items', label: 'Itens', render: (_, row) => row.items?.length || 0 },
    { key: 'total', label: 'Total', sortable: true, render: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v as number) },
    { key: 'priority', label: 'Prioridade', render: (v) => <StatusBadge type="priority" status={v as string} /> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge type="order" status={v as string} /> },
  ];

  const handleAdvanceStatus = (order: DbOrder) => {
    const nextStatus = statusFlow[order.status];
    if (!nextStatus) return;
    updateStatus.mutate({ id: order.id, status: nextStatus });
  };

  const handleCancel = () => {
    if (!selectedOrder) return;
    updateStatus.mutate({ id: selectedOrder.id, status: 'cancelled' }, {
      onSuccess: () => { setIsCancelOpen(false); setSelectedOrder(null); },
    });
  };

  const renderActions = (order: DbOrder) => {
    const nextStatus = statusFlow[order.status];
    const canAdvance = nextStatus !== null && order.status !== 'cancelled';
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { setSelectedOrder(order); setIsViewOpen(true); }}>
            <Eye className="mr-2 h-4 w-4" />Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />Imprimir</DropdownMenuItem>
          {canAdvance && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAdvanceStatus(order)}>
                <CheckCircle className="mr-2 h-4 w-4" />Avançar para {getOrderStatusLabel(nextStatus as any)}
              </DropdownMenuItem>
            </>
          )}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => { setSelectedOrder(order); setIsCancelOpen(true); }}>
                <XCircle className="mr-2 h-4 w-4" />Cancelar Pedido
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const pendingCount = filteredOrders.filter((o) => o.status === 'pending').length;
  const processingCount = filteredOrders.filter((o) => !['pending', 'delivered', 'cancelled'].includes(o.status)).length;
  const totalValue = filteredOrders.filter((o) => o.status !== 'cancelled').reduce((acc, o) => acc + o.total, 0);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie pedidos de venda</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredOrders as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'number', label: 'Pedido' }, { key: 'client_name', label: 'Cliente' },
              { key: 'date', label: 'Data', format: (v) => new Date(v as string).toLocaleDateString('pt-BR') },
              { key: 'total', label: 'Total', format: (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) },
              { key: 'priority', label: 'Prioridade' }, { key: 'status', label: 'Status' },
            ]}
            filename="pedidos"
          />
          <Button className="gap-2"><Plus className="h-4 w-4" />Novo Pedido</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total em Pedidos</p>
          <p className="text-2xl font-bold text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total de Pedidos</p>
          <p className="text-2xl font-bold text-foreground">{filteredOrders.length}</p>
        </div>
        <div className="rounded-lg border bg-warning/10 p-4">
          <p className="text-sm text-warning">Aguardando Aprovação</p>
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
        </div>
        <div className="rounded-lg border bg-info/10 p-4">
          <p className="text-sm text-info">Em Processamento</p>
          <p className="text-2xl font-bold text-info">{processingCount}</p>
        </div>
      </div>

      <AdvancedFilters fields={filterFields} values={filters} onChange={setFilters} onClear={() => setFilters({})} />
      <DataTable columns={columns} data={filteredOrders} searchPlaceholder="Buscar por número, cliente..." pageSize={10} actions={renderActions} />

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detalhes do Pedido</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-lg font-semibold">{selectedOrder.number}</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(selectedOrder.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge type="priority" status={selectedOrder.priority} />
                  <StatusBadge type="order" status={selectedOrder.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Cliente</span><p className="font-medium">{selectedOrder.client_name}</p></div>
                <div><span className="text-muted-foreground">Vendedor</span><p className="font-medium">{selectedOrder.sales_rep_name || '-'}</p></div>
                <div><span className="text-muted-foreground">Forma de Pagamento</span><p className="font-medium">{getPaymentMethodLabel(selectedOrder.payment_method as any)}</p></div>
                <div><span className="text-muted-foreground">Condição de Pagamento</span><p className="font-medium">{selectedOrder.payment_condition}</p></div>
                {selectedOrder.delivery_date && (
                  <div><span className="text-muted-foreground">Previsão de Entrega</span><p className="font-medium">{format(new Date(selectedOrder.delivery_date), 'dd/MM/yyyy', { locale: ptBR })}</p></div>
                )}
              </div>
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="mb-3 font-medium">Itens do Pedido</h4>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left">Produto</th>
                          <th className="p-2 text-right">Qtd</th>
                          <th className="p-2 text-right">Preço Unit.</th>
                          <th className="p-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="p-2"><p className="font-medium">{item.product_name}</p><p className="text-xs text-muted-foreground">{item.product_code}</p></td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price)}</td>
                            <td className="p-2 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="flex justify-end border-t pt-4">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.subtotal)}</span></div>
                  {selectedOrder.discount > 0 && <div className="flex justify-between text-destructive"><span>Desconto</span><span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.discount)}</span></div>}
                  {selectedOrder.shipping > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.shipping)}</span></div>}
                  <div className="flex justify-between border-t pt-1 text-base font-semibold"><span>Total</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedOrder.total)}</span></div>
                </div>
              </div>
              {selectedOrder.notes && <div className="border-t pt-4"><span className="text-sm text-muted-foreground">Observações</span><p className="text-sm">{selectedOrder.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja cancelar o pedido "{selectedOrder?.number}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">Cancelar Pedido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
