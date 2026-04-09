import { useState } from 'react';
import {
  Plus, Eye, MoreHorizontal, FileText, XCircle, CheckCircle, Loader2,
  Package, DollarSign, Clock, TruckIcon, ArrowRight, CalendarDays, User, CreditCard, Hash, MapPin, StickyNote,
} from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { KPICard } from '@/components/shared/KPICard';
import { ExportButton } from '@/components/shared/ExportButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AdvancedFilters, type FilterField } from '@/components/shared/AdvancedFilters';
import { getPaymentMethodLabel, getOrderStatusLabel } from '@/config/commercial';
import { useOrders, useCreateOrder, useUpdateOrderStatus, type DbOrder } from '@/hooks/useOrders';
import { ClientSelector } from '@/components/comercial/ClientSelector';
import { OrderItemsEditor, type LineItem } from '@/components/comercial/OrderItemsEditor';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

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

const statusSteps = ['pending', 'confirmed', 'processing', 'separated', 'invoiced', 'shipped', 'delivered'];

const statusFlow: Record<string, string | null> = {
  pending: 'confirmed', confirmed: 'processing', processing: 'separated',
  separated: 'invoiced', invoiced: 'shipped', shipped: 'delivered',
  delivered: null, cancelled: null,
};

function OrderStatusTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
        <XCircle className="h-5 w-5 text-destructive" />
        <span className="text-sm font-medium text-destructive">Pedido Cancelado</span>
      </div>
    );
  }

  const currentIdx = statusSteps.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {statusSteps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                    ? 'bg-primary/20 text-primary ring-2 ring-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <CheckCircle className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] whitespace-nowrap ${
                  isCurrent ? 'font-semibold text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {getOrderStatusLabel(step as any)}
              </span>
            </div>
            {idx < statusSteps.length - 1 && (
              <div
                className={`mx-0.5 h-0.5 w-4 shrink-0 rounded-full transition-colors ${
                  idx < currentIdx ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const { toast } = useToast();
  const { data: orders = [], isLoading } = useOrders();
  const createOrder = useCreateOrder();
  const updateStatus = useUpdateOrderStatus();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);

  // Form state
  const [formClient, setFormClient] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [formItems, setFormItems] = useState<LineItem[]>([]);
  const [formPayment, setFormPayment] = useState('boleto');
  const [formCondition, setFormCondition] = useState('À vista');
  const [formPriority, setFormPriority] = useState('medium');
  const [formDelivery, setFormDelivery] = useState('');
  const [formShipping, setFormShipping] = useState('0');
  const [formNotes, setFormNotes] = useState('');

  const resetForm = () => {
    setFormClient({ id: null, name: '' });
    setFormItems([]);
    setFormPayment('boleto');
    setFormCondition('À vista');
    setFormPriority('medium');
    setFormDelivery('');
    setFormShipping('0');
    setFormNotes('');
  };

  const handleCreate = () => {
    if (!formClient.name || formItems.length === 0) {
      toast({ title: 'Preencha o cliente e adicione pelo menos um item', variant: 'destructive' });
      return;
    }
    createOrder.mutate({
      client_id: formClient.id,
      client_name: formClient.name,
      payment_method: formPayment,
      payment_condition: formCondition,
      priority: formPriority,
      delivery_date: formDelivery || null,
      shipping: Number(formShipping) || 0,
      notes: formNotes || null,
      items: formItems,
    }, {
      onSuccess: () => { setIsFormOpen(false); resetForm(); },
    });
  };

  const filteredOrders = orders.filter((order) => {
    if (filters.status && order.status !== filters.status) return false;
    if (filters.priority && order.priority !== filters.priority) return false;
    if (filters.paymentMethod && order.payment_method !== filters.paymentMethod) return false;
    if (filters.startDate && new Date(order.date) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(order.date) > new Date(filters.endDate)) return false;
    return true;
  });

  const columns: Column<DbOrder>[] = [
    {
      key: 'number', label: 'Pedido', sortable: true,
      render: (v) => <span className="font-mono font-semibold text-primary">{v as string}</span>,
    },
    {
      key: 'client_name', label: 'Cliente', sortable: true,
      render: (v, row) => (
        <div>
          <p className="font-medium">{v as string}</p>
          <p className="text-xs text-muted-foreground">{getPaymentMethodLabel(row.payment_method as any)}</p>
        </div>
      ),
    },
    { key: 'date', label: 'Data', sortable: true, render: (v) => format(new Date(v as string), 'dd/MM/yyyy', { locale: ptBR }) },
    {
      key: 'delivery_date', label: 'Entrega',
      render: (v) => v ? (
        <div className="flex items-center gap-1.5 text-sm">
          <TruckIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {format(new Date(v as string), 'dd/MM/yyyy', { locale: ptBR })}
        </div>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'items', label: 'Itens',
      render: (_, row) => (
        <Badge variant="secondary" className="font-mono">
          {row.items?.length || 0} {(row.items?.length || 0) === 1 ? 'item' : 'itens'}
        </Badge>
      ),
    },
    {
      key: 'total', label: 'Total', sortable: true,
      render: (v) => <span className="font-semibold">{fmt(v as number)}</span>,
    },
    { key: 'priority', label: 'Prioridade', render: (v) => <StatusBadge type="priority" status={v as string} /> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge type="order" status={v as string} /> },
  ];

  const handleAdvanceStatus = (order: DbOrder) => {
    const nextStatus = statusFlow[order.status];
    if (!nextStatus) return;
    updateStatus.mutate({ id: order.id, status: nextStatus }, {
      onSuccess: () => {
        if (nextStatus === 'confirmed') {
          toast({ title: '🏭 Picking WMS gerado', description: 'Uma ordem de separação foi criada automaticamente no WMS.' });
        }
        if (nextStatus === 'invoiced') {
          toast({ title: '📄 NF-e gerada automaticamente', description: 'Uma NF-e de saída foi criada como rascunho no módulo Fiscal.' });
        }
      }
    });
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
                <ArrowRight className="mr-2 h-4 w-4 text-primary" />
                Avançar para {getOrderStatusLabel(nextStatus as any)}
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
  const deliveredCount = filteredOrders.filter((o) => o.status === 'delivered').length;
  const totalValue = filteredOrders.filter((o) => o.status !== 'cancelled').reduce((acc, o) => acc + o.total, 0);

  if (isLoading) {
    return <PageLoading message="Carregando pedidos..." />;
  }

  return (
    <PageContainer>
      <PageHeader title="Pedidos de Venda" description="Gerencie e acompanhe o ciclo de vida dos seus pedidos">
        <div className="flex gap-2">
          <ExportButton
            data={filteredOrders as unknown as Record<string, unknown>[]}
            columns={[
              { key: 'number', label: 'Pedido' }, { key: 'client_name', label: 'Cliente' },
              { key: 'date', label: 'Data', format: (v) => new Date(v as string).toLocaleDateString('pt-BR') },
              { key: 'total', label: 'Total', format: (v) => fmt(Number(v)) },
              { key: 'priority', label: 'Prioridade' }, { key: 'status', label: 'Status' },
            ]}
            filename="pedidos"
          />
          <Button className="gap-2 shadow-sm" onClick={() => { resetForm(); setIsFormOpen(true); }}>
            <Plus className="h-4 w-4" />Novo Pedido
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Valor Total</p>
              <p className="text-xl font-bold text-foreground">{fmt(totalValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Package className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Pedidos</p>
              <p className="text-xl font-bold text-foreground">{filteredOrders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pendentes</p>
              <p className="text-xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-[11px] text-muted-foreground">{processingCount} em processamento</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Entregues</p>
              <p className="text-xl font-bold text-foreground">{deliveredCount}</p>
              <p className="text-[11px] text-muted-foreground">
                {filteredOrders.length > 0
                  ? `${Math.round((deliveredCount / filteredOrders.length) * 100)}% concluídos`
                  : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <AdvancedFilters fields={filterFields} values={filters} onChange={setFilters} onClear={() => setFilters({})} />
      <DataTable columns={columns} data={filteredOrders} searchPlaceholder="Buscar por número, cliente..." pageSize={10} actions={renderActions} />

      {/* ========== Create Order Dialog ========== */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Novo Pedido de Venda
            </DialogTitle>
            <DialogDescription>Preencha as informações abaixo para registrar um novo pedido.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="mt-2">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="items">Itens</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4 space-y-5">
              <ClientSelector clientId={formClient.id} clientName={formClient.name} onSelect={setFormClient} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Forma de Pagamento</Label>
                  <Select value={formPayment} onValueChange={setFormPayment}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Condição de Pagamento</Label>
                  <Select value={formCondition} onValueChange={setFormCondition}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="À vista">À vista</SelectItem>
                      <SelectItem value="30 dias">30 dias</SelectItem>
                      <SelectItem value="30/60 dias">30/60 dias</SelectItem>
                      <SelectItem value="30/60/90 dias">30/60/90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prioridade</Label>
                  <Select value={formPriority} onValueChange={setFormPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Previsão de Entrega</Label>
                  <Input type="date" value={formDelivery} onChange={(e) => setFormDelivery(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Frete (R$)</Label>
                  <Input type="number" step="0.01" value={formShipping} onChange={(e) => setFormShipping(e.target.value)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="mt-4">
              <OrderItemsEditor items={formItems} onChange={setFormItems} />
            </TabsContent>

            <TabsContent value="details" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Observações</Label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Instruções especiais, observações sobre entrega, etc..."
                  rows={5}
                />
              </div>
              {formItems.length > 0 && (
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Resumo do Pedido</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Itens ({formItems.length})</span>
                        <span>{fmt(formItems.reduce((s, i) => s + (i.quantity * i.unit_price - i.discount), 0))}</span>
                      </div>
                      {Number(formShipping) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frete</span>
                          <span>{fmt(Number(formShipping))}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-base font-bold">
                        <span>Total</span>
                        <span className="text-primary">
                          {fmt(formItems.reduce((s, i) => s + (i.quantity * i.unit_price - i.discount), 0) + (Number(formShipping) || 0))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createOrder.isPending} className="gap-2">
              {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Criar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== View Order Dialog ========== */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0">
          {selectedOrder && (
            <>
              {/* Header Banner */}
              <div className="bg-primary/5 px-6 pt-6 pb-4">
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <DialogTitle className="text-xl">
                          Pedido <span className="font-mono">{selectedOrder.number}</span>
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                          Emitido em {format(new Date(selectedOrder.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge type="priority" status={selectedOrder.priority} />
                      <StatusBadge type="order" status={selectedOrder.status} />
                    </div>
                  </div>
                </DialogHeader>

                {/* Timeline */}
                <div className="mt-4">
                  <OrderStatusTimeline currentStatus={selectedOrder.status} />
                </div>
              </div>

              <div className="space-y-5 px-6 pb-6 pt-2">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                    <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Cliente</p>
                      <p className="text-sm font-medium">{selectedOrder.client_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                    <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pagamento</p>
                      <p className="text-sm font-medium">{getPaymentMethodLabel(selectedOrder.payment_method as any)}</p>
                      <p className="text-xs text-muted-foreground">{selectedOrder.payment_condition}</p>
                    </div>
                  </div>
                  {selectedOrder.delivery_date && (
                    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                      <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Entrega Prevista</p>
                        <p className="text-sm font-medium">
                          {format(new Date(selectedOrder.delivery_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedOrder.sales_rep_name && (
                    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                      <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Vendedor</p>
                        <p className="text-sm font-medium">{selectedOrder.sales_rep_name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Package className="h-3.5 w-3.5" />
                      Itens do Pedido ({selectedOrder.items.length})
                    </h4>
                    <div className="overflow-hidden rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Produto</th>
                            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Qtd</th>
                            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Preço Unit.</th>
                            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Desc.</th>
                            <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item, idx) => (
                            <tr key={item.id} className={idx < selectedOrder.items!.length - 1 ? 'border-b' : ''}>
                              <td className="px-4 py-3">
                                <p className="font-medium">{item.product_name}</p>
                                <p className="font-mono text-xs text-muted-foreground">{item.product_code}</p>
                              </td>
                              <td className="px-4 py-3 text-right font-mono">{item.quantity}</td>
                              <td className="px-4 py-3 text-right">{fmt(item.unit_price)}</td>
                              <td className="px-4 py-3 text-right">
                                {item.discount > 0 ? (
                                  <span className="text-destructive">-{fmt(item.discount)}</span>
                                ) : '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold">{fmt(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="flex justify-end">
                  <Card className="w-72 bg-muted/30">
                    <CardContent className="space-y-2 p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{fmt(selectedOrder.subtotal)}</span>
                      </div>
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-destructive">
                          <span>Desconto</span>
                          <span>-{fmt(selectedOrder.discount)}</span>
                        </div>
                      )}
                      {selectedOrder.shipping > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frete</span>
                          <span>{fmt(selectedOrder.shipping)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-base font-bold">
                        <span>Total</span>
                        <span className="text-primary">{fmt(selectedOrder.total)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
                    <StickyNote className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Observações</p>
                      <p className="mt-1 text-sm">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <div className="flex items-center justify-end gap-2 border-t pt-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => { setIsViewOpen(false); setIsCancelOpen(true); }}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancelar
                    </Button>
                    {statusFlow[selectedOrder.status] && (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => { handleAdvanceStatus(selectedOrder); setIsViewOpen(false); }}
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        Avançar para {getOrderStatusLabel(statusFlow[selectedOrder.status]! as any)}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Cancelar Pedido
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o pedido <strong className="font-mono">{selectedOrder?.number}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
