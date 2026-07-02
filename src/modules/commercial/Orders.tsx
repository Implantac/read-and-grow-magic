import { useMemo, useState } from 'react';
import { CheckCircle, Clock, DollarSign, Package, Plus, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { formatBRL, formatDate } from '@/lib/formatters';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { ExportButton } from '@/shared/components/ExportButton';
import { Button } from '@/ui/base/button';
import { AdvancedFilters } from '@/shared/components/AdvancedFilters';
import {
  useCreateOrder, useDeleteOrder, useOrders, useUpdateOrderFields, useUpdateOrderStatus,
  type DbOrder,
} from '@/hooks/commercial/useOrders';
import { useClients } from '@/hooks/commercial/useClients';
import type { LineItem } from '@/components/commercial/OrderItemsEditor';
import { validateOrder, type CommercialValidation } from '@/hooks/commercial/useCommercialRules';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import { filterFields, statusFlow } from './orders/constants';
import { OrdersTable } from './orders/OrdersTable';
import { SalesKanbanBoard } from './orders/SalesKanbanBoard';
import { CreateOrderDialog } from './orders/CreateOrderDialog';
import { ViewOrderDialog } from './orders/ViewOrderDialog';
import { DeleteOrderDialog } from './orders/DeleteOrderDialog';
import { CancelOrderDialog } from './orders/CancelOrderDialog';
import { ToggleGroup, ToggleGroupItem } from '@/ui/base/toggle-group';

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const { data: clients = [] } = useClients();
  const createOrder = useCreateOrder();
  const updateStatus = useUpdateOrderStatus();
  const updateFields = useUpdateOrderFields();
  const deleteOrder = useDeleteOrder();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Form state
  const [formClient, setFormClient] = useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [formItems, setFormItems] = useState<LineItem[]>([]);
  const [formPayment, setFormPayment] = useState('boleto');
  const [formCondition, setFormCondition] = useState('À vista');
  const [formPriority, setFormPriority] = useState('medium');
  const [formDelivery, setFormDelivery] = useState('');
  const [formShipping, setFormShipping] = useState('0');
  const [formNotes, setFormNotes] = useState('');

  const orderValidations = useMemo<CommercialValidation[]>(() => {
    if (!formClient.id || formItems.length === 0) return [];
    const client = clients.find(c => c.id === formClient.id) || null;
    const subtotal = formItems.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
    const discount = formItems.reduce((s, i) => s + i.discount, 0);
    const discountPct = subtotal > 0 ? (discount / subtotal) * 100 : 0;
    const clientOrders = orders.filter(o => o.client_id === formClient.id);
    return validateOrder({
      client,
      subtotal,
      discount,
      discountPct,
      maxDiscountPct: 10,
      paymentCondition: formCondition,
      isNewClient: clientOrders.length === 0,
    });
  }, [formClient, formItems, formCondition, clients, orders]);

  const hasBlocks = orderValidations.some(v => v.type === 'block');

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
      toastError('Preencha o cliente e adicione pelo menos um item');
      return;
    }
    if (hasBlocks) {
      toastError('Corrija as pendências antes de continuar.', undefined, 'Pedido bloqueado');
      return;
    }
    const needsApproval = orderValidations.some(v => v.type === 'approval');
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
      onSuccess: () => {
        setIsFormOpen(false);
        resetForm();
        if (needsApproval) {
          toastSuccess('⚠️ Pedido criado com pendência de aprovação', 'Desconto ou condição especial requer aprovação.');
        }
      },
    });
  };

  const confirmDelete = () => {
    if (selectedOrder) {
      deleteOrder.mutate(selectedOrder.id, {
        onSuccess: () => {
          setIsDeleteConfirmOpen(false);
          setSelectedOrder(null);
        },
      });
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filters.status && order.status !== filters.status) return false;
    if (filters.priority && order.priority !== filters.priority) return false;
    if (filters.paymentMethod && order.payment_method !== filters.paymentMethod) return false;
    if (filters.startDate) {
      const orderDate = new Date(order.date);
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (orderDate < startDate) return false;
    }
    if (filters.endDate) {
      const orderDate = new Date(order.date);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (orderDate > endDate) return false;
    }
    return true;
  });

  const handleAdvanceStatus = (order: DbOrder) => {
    const nextStatus = statusFlow[order.status];
    if (!nextStatus) return;
    updateStatus.mutate({ id: order.id, status: nextStatus }, {
      onSuccess: () => {
        if (nextStatus === 'confirmed') {
          toastSuccess('🏭 Picking WMS gerado', 'Uma ordem de separação foi criada automaticamente no WMS.');
        }
        if (nextStatus === 'invoiced') {
          toastSuccess('📄 NF-e gerada automaticamente', 'Uma NF-e de saída foi criada como rascunho no módulo Fiscal.');
        }
      },
    });
  };

  const handleCancel = () => {
    if (!selectedOrder) return;
    updateStatus.mutate({ id: selectedOrder.id, status: 'cancelled' }, {
      onSuccess: () => { setIsCancelOpen(false); setSelectedOrder(null); },
    });
  };

  const handleApproval = (orderId: string, field: string, value: string) => {
    updateFields.mutate({ id: orderId, [field]: value, ...(value === 'approved' ? { approved_at: new Date().toISOString() } : {}) });
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
        <ExportButton
          data={filteredOrders as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'number', label: 'Pedido' }, { key: 'client_name', label: 'Cliente' },
            { key: 'date', label: 'Data', format: (v) => formatDate(v as string) },
            { key: 'total', label: 'Total', format: (v) => formatBRL(Number(v)) },
            { key: 'priority', label: 'Prioridade' }, { key: 'status', label: 'Status' },
          ]}
          filename="pedidos"
        />
        <Button className="gap-2 shadow-sm" onClick={() => { resetForm(); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4" />Novo Pedido
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Valor Total" value={formatBRL(totalValue)} icon={<DollarSign className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Total Pedidos" value={filteredOrders.length} icon={<Package className="h-5 w-5" />} accentColor="accent" index={1} />
        <KPICard title="Pendentes" value={pendingCount} subtitle={`${processingCount} em processamento`} icon={<Clock className="h-5 w-5" />} accentColor="warning" index={2} />
        <KPICard title="Entregues" value={deliveredCount} subtitle={filteredOrders.length > 0 ? `${Math.round((deliveredCount / filteredOrders.length) * 100)}% concluídos` : '—'} icon={<CheckCircle className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

      <AdvancedFilters fields={filterFields} values={filters} onChange={setFilters} onClear={() => setFilters({})} />

      <OrdersTable
        orders={filteredOrders}
        selectedOrder={selectedOrder}
        isDeletePending={deleteOrder.isPending}
        isAdvancePending={updateStatus.isPending}
        onView={(order) => { setSelectedOrder(order); setIsViewOpen(true); }}
        onAdvance={handleAdvanceStatus}
        onAskDelete={(order) => { setSelectedOrder(order); setIsDeleteConfirmOpen(true); }}
        onAskCancel={(order) => { setSelectedOrder(order); setIsCancelOpen(true); }}
      />

      <CreateOrderDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        formClient={formClient}
        setFormClient={setFormClient}
        formItems={formItems}
        setFormItems={setFormItems}
        formPayment={formPayment}
        setFormPayment={setFormPayment}
        formCondition={formCondition}
        setFormCondition={setFormCondition}
        formPriority={formPriority}
        setFormPriority={setFormPriority}
        formDelivery={formDelivery}
        setFormDelivery={setFormDelivery}
        formShipping={formShipping}
        setFormShipping={setFormShipping}
        formNotes={formNotes}
        setFormNotes={setFormNotes}
        orderValidations={orderValidations}
        isPending={createOrder.isPending}
        onSubmit={handleCreate}
      />

      <ViewOrderDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        order={selectedOrder}
        onApprove={handleApproval}
        onAdvance={handleAdvanceStatus}
        onAskCancel={() => setIsCancelOpen(true)}
      />

      <DeleteOrderDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        orderNumber={selectedOrder?.number}
        isPending={deleteOrder.isPending}
        onCancel={() => setSelectedOrder(null)}
        onConfirm={confirmDelete}
      />

      <CancelOrderDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        orderNumber={selectedOrder?.number}
        onConfirm={handleCancel}
      />
    </PageContainer>
  );
}
