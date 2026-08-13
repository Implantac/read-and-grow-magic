import { useState, useEffect } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { 
  Package, Truck, Factory, Store, ArrowRightLeft, 
  Download, Upload, AlertTriangle, ClipboardList, Search, Plus, 
  CheckCircle2, Clock, ChevronRight, Activity, Zap, History, SearchX
} from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { useSupplyChain } from '@/hooks/operational/supply-chain/useSupplyChain';
import { MovementStatus } from '@/services/operational/supply-chain/supplyChainService';
import { useActiveTenant } from '@/hooks/shared/useActiveTenant';
import { useComplianceValidation } from '@/hooks/compliance/useComplianceValidation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { MovementLedger } from './components/MovementLedger';
import { NewTransferDialog } from '@/modules/wms/TransferenciasCanal';

const STATUS_MAP: Record<MovementStatus, { label: string, color: string, icon: any }> = {
  requested: { label: 'Solicitado', color: 'bg-blue-500/10 text-blue-500', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-cyan-500/10 text-cyan-500', icon: CheckCircle2 },
  reserved: { label: 'Reservado', color: 'bg-indigo-500/10 text-indigo-500', icon: Package },
  picking: { label: 'Em Separação', color: 'bg-amber-500/10 text-amber-500', icon: Package },
  shipped: { label: 'Expedido', color: 'bg-orange-500/10 text-orange-500', icon: Upload },
  in_transit: { label: 'Em Trânsito', color: 'bg-purple-500/10 text-purple-500', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2 },
  checked: { label: 'Conferido', color: 'bg-teal-500/10 text-teal-500', icon: CheckCircle2 },
  completed: { label: 'Finalizado', color: 'bg-slate-500/10 text-slate-500', icon: CheckCircle2 },
  divergent: { label: 'Divergente', color: 'bg-red-500/10 text-red-500', icon: AlertTriangle },
  investigating: { label: 'Em Investigação', color: 'bg-zinc-500/10 text-zinc-500', icon: Search },
};

export default function UnifiedSupplyChain() {
  const { branch: currentBranch, isLoading: isEnterpriseLoading } = useActiveTenant();
  const { movements, isLoading: isSupplyLoading, updateStatus } = useSupplyChain();
  
  const isLoading = isEnterpriseLoading || isSupplyLoading;
  const { logAudit } = useComplianceValidation();
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

  const unitType = (currentBranch as any)?.tipo?.toLowerCase() || 'store';

  const handleNextStep = async (m: any) => {
    const statusOrder: MovementStatus[] = [
      'requested', 'approved', 'reserved', 'picking', 'shipped', 'in_transit', 'delivered', 'checked', 'completed'
    ];

    const currentIndex = statusOrder.indexOf(m.status);
    if (currentIndex !== -1 && currentIndex < statusOrder.length - 1) {
      const nextStatus = statusFlow[m.status] || statusOrder[currentIndex + 1];
      
      await updateStatus(m.id, nextStatus as any);
      
      // Log de Auditoria Compliance UEEF SEC-LEVEL 3
      await logAudit('movement_status_change', {
        movement_id: m.id,
        from_status: m.status,
        to_status: nextStatus,
        severity: 'info'
      });
      
      toast.success(`Status da movimentação #${m.id.split('-')[0]} atualizado.`);
    }
  };

  const statusFlow: Record<string, MovementStatus> = {
    'requested': 'approved',
    'approved': 'reserved',
    'reserved': 'picking',
    'picking': 'shipped',
    'shipped': 'in_transit',
    'in_transit': 'delivered',
    'delivered': 'checked',
    'checked': 'completed'
  };

  return (
    <PageContainer loading={isLoading}>
      <div className="space-y-6 pb-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              {unitType === 'factory' && <Factory className="h-8 w-8 text-primary" />}
              {unitType === 'warehouse' && <Package className="h-8 w-8 text-primary" />}
              {unitType === 'store' && <Store className="h-8 w-8 text-primary" />}
              Central de Abastecimento
            </h1>
            <p className="text-muted-foreground font-medium">
              Malha Logística: {currentBranch?.name || '---'} ({unitType.toUpperCase()})
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="gap-2 font-bold uppercase text-xs"
              onClick={() => setIsTransferDialogOpen(true)}
            >
              <Plus className="h-4 w-4" /> Nova Solicitação
            </Button>
            <NewTransferDialog 
              open={isTransferDialogOpen} 
              onOpenChange={setIsTransferDialogOpen}
              trigger={null} 
            />
            <Button variant="outline" className="gap-2 font-bold uppercase text-xs">
              <Search className="h-4 w-4" /> Consultar Rede
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Solicitações" value={movements.filter(m => m.status === 'requested').length} icon={ClipboardList} color="blue" />
          <StatCard title="Em Operação" value={movements.filter(m => ['picking', 'shipped'].includes(m.status)).length} icon={Zap} color="orange" />
          <StatCard title="Em Trânsito" value={movements.filter(m => m.status === 'in_transit').length} icon={Truck} color="purple" />
          <StatCard title="Divergências" value={movements.filter(m => m.status === 'divergent').length} icon={AlertTriangle} color="red" />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-[500px]">
            <TabsTrigger value="all" className="font-bold uppercase text-[10px]">Todas</TabsTrigger>
            <TabsTrigger value="inbound" className="font-bold uppercase text-[10px]">Entradas</TabsTrigger>
            <TabsTrigger value="outbound" className="font-bold uppercase text-[10px]">Saídas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-primary" /> Fluxo de Movimentação
                </CardTitle>
                <Badge variant="outline" className="text-[10px] uppercase font-bold">Total: {movements.length}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {movements.length === 0 ? (
                    <EmptyState 
                      title="Nenhuma movimentação registrada"
                      description="A malha logística está sem solicitações ativas no momento. Crie uma nova transferência para iniciar o fluxo."
                      action={{ label: "Nova Solicitação", onClick: () => setIsTransferDialogOpen(true) }}
                    />
                  ) : (
                    movements.map(m => (
                      <div key={m.id} className="group border rounded-xl p-4 hover:border-primary/50 transition-all bg-card shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-full", STATUS_MAP[m.status]?.color)}>
                              {(() => {
                                const Icon = STATUS_MAP[m.status]?.icon || Package;
                                return <Icon className="h-5 w-5" />;
                              })()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-black text-xs uppercase text-muted-foreground">{m.origin_type}</span>
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                <span className="font-black text-xs uppercase text-muted-foreground">{m.destination_type}</span>
                              </div>
                              <h3 className="font-bold text-sm">Transferência #{m.id.split('-')[0].toUpperCase()}</h3>
                              <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">
                                {m.items_count} Itens • Prioridade: {m.priority}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 justify-end">
                            <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5", STATUS_MAP[m.status]?.color)}>
                              {STATUS_MAP[m.status]?.label || m.status}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className={cn(
                                "h-8 w-8 p-0 rounded-full",
                                selectedMovement === m.id ? "bg-primary text-primary-foreground" : ""
                              )}
                              onClick={() => setSelectedMovement(selectedMovement === m.id ? null : m.id)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="h-8 font-black text-[9px] uppercase"
                              onClick={() => handleNextStep(m)}
                              disabled={['delivered', 'checked', 'completed', 'divergent'].includes(m.status)}
                            >
                              {m.status === 'requested' ? 'Aprovar Solicitação' : 'Avançar Etapa'}
                            </Button>

                          </div>
                        </div>

                        {selectedMovement === m.id && (
                          <div className="mt-4 pt-4 border-t animate-in slide-in-from-top-2 duration-300">
                            <MovementLedger movementId={m.id} />
                          </div>
                        )}
                        
                        {/* Status Lifecycle Indicator */}
                        <div className="mt-4 flex items-center gap-1 w-full opacity-60">
                          {['requested', 'approved', 'reserved', 'picking', 'shipped', 'in_transit', 'delivered', 'checked', 'completed'].map((status, idx) => {
                            const currentIdx = ['requested', 'approved', 'reserved', 'picking', 'shipped', 'in_transit', 'delivered', 'checked', 'completed'].indexOf(m.status);
                            return (
                              <div key={status} className="flex items-center gap-1 flex-1">
                                <div className={cn('h-1.5 flex-1 rounded-full transition-colors', idx <= currentIdx ? 'bg-primary' : 'bg-muted')} />
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500/5 border-blue-500/20',
    orange: 'text-orange-500 bg-orange-500/5 border-orange-500/20',
    purple: 'text-purple-500 bg-purple-500/5 border-purple-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20',
    red: 'text-red-500 bg-red-500/5 border-red-500/20',
  };

  return (
    <Card className={cn("border transition-all hover:shadow-md", colors[color])}>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase opacity-60 mb-1">{title}</p>
          <p className="text-3xl font-black">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-background/50 backdrop-blur-sm border shadow-inner">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}