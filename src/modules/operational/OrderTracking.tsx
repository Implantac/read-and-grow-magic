import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader } from '@/ui/base/card';
import { Input } from '@/ui/base/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Search } from 'lucide-react';
import { useOrders } from '@/hooks/commercial/useOrders';
import { orderFlowStatuses } from '@/hooks/commercial/useOrderFlow';
import { useOrderLifecycle } from '@/hooks/commercial/useOrderLifecycle';
import { OrderTrackingKPIs } from '@/modules/operational/orderTracking/OrderTrackingKPIs';
import { OrderTrackingTable } from '@/modules/operational/orderTracking/OrderTrackingTable';
import { OrderDetailDialog } from '@/modules/operational/orderTracking/OrderDetailDialog';
import { TransitionConfirmDialog } from '@/modules/operational/orderTracking/TransitionConfirmDialog';

export default function OrderTracking() {
  const { data: orders, isLoading } = useOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [transitionDialog, setTransitionDialog] = useState<{ order: any; targetStatus: string } | null>(null);
  const [observation, setObservation] = useState('');
  const lifecycle = useOrderLifecycle();

  const filtered = (orders || []).filter((o) => {
    const matchSearch =
      !search ||
      o.number.toLowerCase().includes(search.toLowerCase()) ||
      o.client_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = (orders || []).reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const handleTransition = (order: any, targetStatus: string) => {
    if (targetStatus === 'blocked' || targetStatus === 'cancelled') {
      setTransitionDialog({ order, targetStatus });
      setObservation('');
    } else {
      lifecycle.mutate({ orderId: order.id, order, targetStatus });
    }
  };

  const confirmTransition = () => {
    if (!transitionDialog) return;
    lifecycle.mutate({
      orderId: transitionDialog.order.id,
      order: transitionDialog.order,
      targetStatus: transitionDialog.targetStatus,
      observation,
      blockReason: transitionDialog.targetStatus === 'blocked' ? observation : undefined,
    });
    setTransitionDialog(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Acompanhamento de Pedidos"
        description="Fluxo integrado do pedido - do comercial à entrega"
      />

      <OrderTrackingKPIs totalOrders={orders?.length || 0} statusCounts={statusCounts} />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedido..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {orderFlowStatuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <OrderTrackingTable
            isLoading={isLoading}
            allOrders={orders}
            filtered={filtered}
            search={search}
            statusFilter={statusFilter}
            onClearFilters={() => { setSearch(''); setStatusFilter('all'); }}
            onSelectOrder={setSelectedOrder}
            onTransition={handleTransition}
            lifecyclePending={lifecycle.isPending}
          />
        </CardContent>
      </Card>

      <OrderDetailDialog
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onTransition={handleTransition}
        lifecyclePending={lifecycle.isPending}
      />

      <TransitionConfirmDialog
        open={!!transitionDialog}
        targetStatus={transitionDialog?.targetStatus}
        observation={observation}
        setObservation={setObservation}
        onCancel={() => setTransitionDialog(null)}
        onConfirm={confirmTransition}
        disabled={lifecycle.isPending}
      />
    </PageContainer>
  );
}
