import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/hooks/useOrders';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { useBillingQueue, useShipmentOrders, useConferenceRecords, getOrderFlowStatus } from '@/hooks/useOrderFlow';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Factory, Package, Truck, ClipboardCheck, DollarSign, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

export default function OperationalDashboard() {
  const { data: orders } = useOrders();
  const { orders: productionOrders } = useProductionOrders();
  const { data: billingItems } = useBillingQueue();
  const { data: shipments } = useShipmentOrders();
  const { data: conferences } = useConferenceRecords();

  const ordersByStatus = (orders || []).reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const orderStatusData = Object.entries(ordersByStatus).map(([status, count]) => ({
    name: getOrderFlowStatus(status).label,
    value: count,
  }));

  const prodByStatus = productionOrders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const prodStatusData = Object.entries(prodByStatus).map(([status, count]) => ({
    name: status === 'planned' ? 'Planejada' : status === 'in_progress' ? 'Em Andamento' : status === 'completed' ? 'Concluída' : status,
    value: count,
  }));

  const blockedOrders = (orders || []).filter(o => o.status === 'blocked').length;
  const awaitingProduction = (orders || []).filter(o => o.status === 'awaiting_production' || o.status === 'in_production').length;
  const awaitingSeparation = (orders || []).filter(o => o.status === 'awaiting_separation' || o.status === 'in_separation').length;
  const awaitingBilling = billingItems?.filter((i: any) => i.status === 'awaiting_billing').length || 0;
  const pendingConference = conferences?.filter((c: any) => c.status === 'pending').length || 0;
  const inTransit = shipments?.filter((s: any) => s.status === 'in_transit' || s.status === 'dispatched').length || 0;

  const kpis = [
    { label: 'Pedidos Ativos', value: orders?.length || 0, icon: FileText, color: 'text-primary' },
    { label: 'Ordens Produção', value: productionOrders.length, icon: Factory, color: 'text-info' },
    { label: 'Bloqueados', value: blockedOrders, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Aguard. Separação', value: awaitingSeparation, icon: Package, color: 'text-warning' },
    { label: 'Aguard. Produção', value: awaitingProduction, icon: Factory, color: 'text-warning' },
    { label: 'Conferência Pendente', value: pendingConference, icon: ClipboardCheck, color: 'text-accent-foreground' },
    { label: 'Aguard. Faturamento', value: awaitingBilling, icon: DollarSign, color: 'text-warning' },
    { label: 'Em Trânsito', value: inTransit, icon: Truck, color: 'text-info' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Dashboard Operacional" description="Visão integrada do fluxo comercial → produção → expedição → faturamento" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className={cn('h-7 w-7 flex-shrink-0', k.color)} />
              <div>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Pedidos por Status</CardTitle></CardHeader>
          <CardContent>
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={orderStatusData} layout="vertical" margin={{ left: 100 }}>
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ordens de Produção</CardTitle></CardHeader>
          <CardContent>
            {prodStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={prodStatusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {prodStatusData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
