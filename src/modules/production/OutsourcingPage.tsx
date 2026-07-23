import { useState, useMemo } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { useOutsourcingOrders, type OutsourcingOrderRow } from '@/hooks/production/useOutsourcingOrders';
import { useProductionOrders } from '@/hooks/production/useProductionOrders';
import { useSuppliers } from '@/hooks/purchasing/useSuppliers';
import { KanbanService } from '@/lib/pcpServices';
import { format } from 'date-fns';
import { LateAlertsCard } from './outsourcing/LateAlertsCard';
import { OutsourcingKPIs } from './outsourcing/OutsourcingKPIs';
import { OrdersTab } from './outsourcing/OrdersTab';
import { MetricsTab } from './outsourcing/MetricsTab';
import { CreateOSDialog, type OSForm } from './outsourcing/CreateOSDialog';
import { ReceiveDialog } from './outsourcing/ReceiveDialog';

export default function OutsourcingPage() {
  const { orders: outsourcingOrders, loading, create, update, lateOrders } = useOutsourcingOrders();
  const { orders: productionOrders, update: updateOP } = useProductionOrders();
  const { suppliers } = useSuppliers();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OutsourcingOrderRow | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const initialForm: OSForm = {
    production_order_id: '', supplier_name: '', supplier_id: '', service_description: '',
    sent_date: format(new Date(), 'yyyy-MM-dd'), expected_return_date: '', quantity_sent: 0, unit_cost: 0, notes: '',
  };
  const [form, setForm] = useState<OSForm>(initialForm);
  const resetForm = () => setForm(initialForm);

  const activeOPs = productionOrders.filter(o => !['completed', 'cancelled'].includes(o.status));

  const filtered = useMemo(() => outsourcingOrders.filter(o => {
    const matchSearch = !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  }), [outsourcingOrders, search, statusFilter]);

  const totalCost = outsourcingOrders.reduce((s, o) => s + (o.total_cost || 0), 0);
  const pendingCount = outsourcingOrders.filter(o => o.status !== 'returned').length;
  const returnedCount = outsourcingOrders.filter(o => o.status === 'returned').length;

  const handleCreate = async () => {
    const selectedOP = activeOPs.find(o => o.id === form.production_order_id);
    if (!selectedOP) return;
    const orderNumber = `OS-${format(new Date(), 'yyyyMMdd')}-${selectedOP.order_number.slice(-4)}`;
    const totalCostVal = form.quantity_sent * form.unit_cost;
    const success = await create({
      ...form,
      order_number: orderNumber,
      total_cost: totalCostVal,
      supplier_id: form.supplier_id || null,
    } as any);
    if (success) {
      await updateOP(form.production_order_id, { status: 'outsourced' });
      setShowCreateDialog(false);
      resetForm();
    }
  };

  const handleStatusChange = async (order: OutsourcingOrderRow, newStatus: string) => {
    const updates: Partial<OutsourcingOrderRow> = { status: newStatus };
    if (newStatus === 'returned') {
      updates.actual_return_date = new Date().toISOString().split('T')[0];
      await updateOP(order.production_order_id, { status: 'in_progress' });
    }
    await update(order.id, updates);
  };

  const handleReceive = async (order: OutsourcingOrderRow, returnedQty: number, rejectedQty: number) => {
    await update(order.id, {
      status: 'returned',
      actual_return_date: new Date().toISOString().split('T')[0],
      quantity_returned: returnedQty,
      quantity_rejected: rejectedQty,
    });
    await updateOP(order.production_order_id, { status: 'finishing' });
    setEditingOrder(null);
  };

  const supplierMetrics = useMemo(() => KanbanService.calculateSupplierMetrics(outsourcingOrders), [outsourcingOrders]);

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Terceirização" description="Controle de ordens enviadas para fornecedores terceirizados" />

      <OutsourcingKPIs pendingCount={pendingCount} lateCount={lateOrders.length} returnedCount={returnedCount} totalCost={totalCost} />

      <LateAlertsCard lateOrders={lateOrders} />

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Ordens de Serviço</TabsTrigger>
          <TabsTrigger value="metrics">Métricas de Fornecedores</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <OrdersTab
            search={search} setSearch={setSearch}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            onCreate={() => setShowCreateDialog(true)}
            filtered={filtered}
            totalOrders={outsourcingOrders.length}
            productionOrders={productionOrders}
            onStatusChange={handleStatusChange}
            onReceive={setEditingOrder}
          />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <MetricsTab supplierMetrics={supplierMetrics} />
        </TabsContent>
      </Tabs>

      <CreateOSDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        form={form} setForm={setForm}
        activeOPs={activeOPs}
        suppliers={suppliers}
        onCreate={handleCreate}
      />

      {editingOrder && (
        <ReceiveDialog order={editingOrder} onClose={() => setEditingOrder(null)} onReceive={handleReceive} />
      )}
    </PageContainer>
  );
}
