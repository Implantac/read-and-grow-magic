import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { ExportButton } from '@/shared/components/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { ClipboardList, Layers } from 'lucide-react';
import { useWMSPicking } from '@/hooks/wms/useWMSOperations';
import { format } from 'date-fns';
import { PickingFilters } from './picking/PickingFilters';
import { PickingKPIs } from './picking/PickingKPIs';
import { PickingTable } from './picking/PickingTable';
import { WavesTab } from './picking/WavesTab';
import { PickingDetailsDialog } from './picking/PickingDetailsDialog';
import { StartPickingDialog } from './picking/StartPickingDialog';

export default function PickingPage() {
  const { orders, loading, startPicking, completePicking } = useWMSPicking();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [startDialog, setStartDialog] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [scannedItems, setScannedItems] = useState<Record<string, number>>({});
  const [operator, setOperator] = useState('');

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const inProgressCount = orders.filter(o => o.status === 'in_progress' || o.status === 'assigned').length;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const completedToday = orders.filter(o => o.status === 'completed' && o.completedAt?.startsWith(todayStr)).length;
  const urgentCount = orders.filter(o => o.priority === 'urgent' && o.status !== 'completed').length;

  const handleStart = async () => {
    if (!startDialog || !operator.trim()) return;
    await startPicking(startDialog, operator);
    setStartDialog(null);
    setOperator('');
    setIsDetailsOpen(false);
  };

  const openDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
    setScannedItems({});
  };

  return (
    <PageContainer>
      <PageHeader title="Picking" description="Separação de pedidos para expedição">
        <ExportButton
          data={filteredOrders as unknown as Record<string, unknown>[]}
          columns={[
            { key: 'orderNumber', label: 'Nº Ordem' },
            { key: 'customerName', label: 'Cliente' },
            { key: 'priority', label: 'Prioridade' },
            { key: 'status', label: 'Status' },
            { key: 'assignedTo', label: 'Operador' },
          ]}
          filename="picking_wms"
        />
      </PageHeader>

      <PickingKPIs
        pendingCount={pendingCount}
        inProgressCount={inProgressCount}
        completedToday={completedToday}
        urgentCount={urgentCount}
      />

      <PickingFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="gap-2"><ClipboardList className="h-4 w-4" /> Lista de Pedidos</TabsTrigger>
          <TabsTrigger value="waves" className="gap-2"><Layers className="h-4 w-4" /> Ondas de Separação</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Ordens de Picking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PickingTable orders={filteredOrders} loading={loading} onOpenDetails={openDetails} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waves">
          <WavesTab />
        </TabsContent>
      </Tabs>

      <PickingDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
        scannedItems={scannedItems}
        setScannedItems={setScannedItems}
        onStart={() => setStartDialog(selectedOrder.id)}
        onComplete={() => { completePicking(selectedOrder.id); setIsDetailsOpen(false); }}
      />

      <StartPickingDialog
        open={!!startDialog}
        onOpenChange={(o) => !o && setStartDialog(null)}
        operator={operator}
        onOperatorChange={setOperator}
        onConfirm={handleStart}
      />
    </PageContainer>
  );
}
