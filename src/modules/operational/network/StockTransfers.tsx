import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Truck, Plus, ArrowRight, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTransferOrders } from '@/hooks/operational/network/useNetworkArchitecture';
import { EmptyState } from '@/shared/components/EmptyState';
import { ScrollArea } from '@/ui/base/scroll-area';

const statusMap: Record<string, { label: string, color: string, icon: any }> = {
  draft: { label: 'Rascunho', color: 'bg-slate-500', icon: Clock },
  pending: { label: 'Pendente', color: 'bg-amber-500', icon: Clock },
  approved: { label: 'Aprovada', color: 'bg-blue-500', icon: CheckCircle2 },
  shipped: { label: 'Em Trânsito', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Recebida', color: 'bg-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', color: 'bg-red-500', icon: AlertTriangle },
};

export default function StockTransfersPage() {
  const { data: transfers, isLoading } = useTransferOrders();

  return (
    <PageContainer loading={isLoading}>
      <PageHeader 
        title="Transferências de Estoque" 
        description="Gestão de movimentações entre Unidades e CDs"
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nova Transferência
        </Button>
      </PageHeader>

      <div className="grid gap-6">
        {transfers && transfers.length > 0 ? (
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {transfers.map((order: any) => {
                const status = statusMap[order.status] || statusMap.pending;
                return (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${status.color} bg-opacity-10 text-opacity-100`}>
                            <status.icon className={`h-5 w-5 text-current`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">TRF-{order.id.split('-')[0].toUpperCase()}</span>
                              <Badge className={status.color}>{status.label}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <span>{order.origin?.name}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span>{order.destination?.name}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Data Solicitada</p>
                            <p className="text-sm font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <Button variant="ghost" size="sm">Ver Detalhes</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <EmptyState 
            icon={Truck}
            title="Nenhuma transferência"
            description="Inicie um pedido de transferência para movimentar estoque entre unidades."
          />
        )}
      </div>
    </PageContainer>
  );
}
