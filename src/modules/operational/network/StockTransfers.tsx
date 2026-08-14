import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Truck, Plus, ArrowRight, Clock, CheckCircle2, AlertTriangle, List, History, ClipboardCheck, PackageCheck, Send, MoveRight, User, Calendar } from 'lucide-react';
import { useTransferOrders } from '@/hooks/operational/network/useNetworkArchitecture';
import { EmptyState } from '@/shared/components/EmptyState';
import { ScrollArea } from '@/ui/base/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { transferWorkflow, TransferStatus } from '@/services/operational/inventory/transferWorkflow';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Separator } from '@/ui/base/separator';
import { Textarea } from '@/ui/base/textarea';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';

const workflowSteps: { status: TransferStatus, label: string, icon: any, color: string }[] = [
  { status: 'SUGERIDA', label: 'Sugerida', icon: Clock, color: 'bg-slate-500' },
  { status: 'APROVADA', label: 'Aprovada', icon: ClipboardCheck, color: 'bg-blue-500' },
  { status: 'RESERVADA', label: 'Reservada', icon: List, color: 'bg-indigo-500' },
  { status: 'SEPARAÇÃO', label: 'Separação', icon: PackageCheck, color: 'bg-amber-500' },
  { status: 'CONFERÊNCIA', label: 'Conferência', icon: ClipboardCheck, color: 'bg-orange-500' },
  { status: 'EXPEDIDA', label: 'Expedida', icon: Send, color: 'bg-purple-500' },
  { status: 'EM TRÂNSITO', label: 'Em Trânsito', icon: Truck, color: 'bg-violet-500' },
  { status: 'RECEBIDA', label: 'Recebida', icon: ArrowRight, color: 'bg-cyan-500' },
  { status: 'CONFERIDA', label: 'Conferida', icon: CheckCircle2, color: 'bg-emerald-500' },
  { status: 'ENCERRADA', label: 'Encerrada', icon: CheckCircle2, color: 'bg-green-600' },
];

export default function StockTransfersPage() {
  const { data: transfers, isLoading, refetch } = useTransferOrders();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [transitionNotes, setTransitionNotes] = useState('');
  const [transitionQty, setTransitionQty] = useState<number>(0);
  const [transitionDivergence, setTransitionDivergence] = useState<number>(0);

  const handleOpenDetails = async (order: any) => {
    setSelectedOrder(order);
    try {
      const logs = await transferWorkflow.getHistory(order.id);
      setHistory(logs);
      setTransitionQty(0);
      setTransitionDivergence(0);
      setTransitionNotes('');
    } catch (error) {
      toast.error("Erro ao carregar histórico");
    }
  };

  const handleAdvance = async () => {
    if (!selectedOrder || !user) return;
    
    const currentIndex = workflowSteps.findIndex(s => s.status === (selectedOrder.current_status || 'SUGERIDA'));
    const nextStep = workflowSteps[currentIndex + 1];
    
    if (!nextStep) {
      toast.info("Transferência já está no estágio final");
      return;
    }

    try {
      await transferWorkflow.transition({
        transferId: selectedOrder.id,
        toStatus: nextStep.status,
        userId: user.id,
        notes: transitionNotes,
        quantity: transitionQty,
        divergence: transitionDivergence
      });
      
      toast.success(`Transferência avançada para ${nextStep.label}`);
      refetch();
      handleOpenDetails({ ...selectedOrder, current_status: nextStep.status });
    } catch (error) {
      toast.error("Erro ao avançar workflow");
    }
  };

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
                const currentStatus = order.current_status || 'SUGERIDA';
                const step = workflowSteps.find(s => s.status === currentStatus) || workflowSteps[0];
                return (
                  <Card key={order.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenDetails(order)}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${step.color} bg-opacity-10 text-opacity-100`}>
                            <step.icon className={`h-5 w-5 text-current`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">TRF-{order.id.split('-')[0].toUpperCase()}</span>
                              <Badge className={step.color}>{step.label}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <span>{order.origin?.name || 'Origem'}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span>{order.destination?.name || 'Destino'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Última Atualização</p>
                            <p className="text-sm font-medium">{new Date(order.updated_at).toLocaleDateString()}</p>
                          </div>
                          <Button variant="outline" size="sm">Gerenciar Workflow</Button>
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

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Workflow de Transferência - TRF-{selectedOrder?.id?.split('-')[0].toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Acompanhamento e evolução das etapas operacionais.
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-3 gap-6 py-4">
            <div className="md:col-span-2 space-y-6">
              {/* Stepper Horizontal Simplificado */}
              <div className="flex justify-between items-center px-2 py-4 bg-muted/30 rounded-lg overflow-x-auto gap-4">
                {workflowSteps.map((step, idx) => {
                  const currentStatus = selectedOrder?.current_status || 'SUGERIDA';
                  const currentIndex = workflowSteps.findIndex(s => s.status === currentStatus);
                  const isCompleted = idx < currentIndex;
                  const isCurrent = idx === currentIndex;

                  return (
                    <div key={step.status} className="flex flex-col items-center min-w-[80px]">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-all
                        ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary ring-4 ring-primary/20 text-white' : 'bg-muted text-muted-foreground'}
                      `}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-4 w-4" />}
                      </div>
                      <span className={`text-[10px] mt-2 font-medium text-center ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4" /> Histórico Operacional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                      {history.map((log: any) => (
                        <div key={log.id} className="flex gap-4 items-start border-l-2 border-muted pl-4 relative">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-muted" />
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                              <Badge variant="outline" className="text-[10px]">{log.status}</Badge>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> {new Date(log.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium flex items-center gap-2">
                              <User className="h-3 w-3" /> {log.profiles?.name || 'Sistema'}
                            </p>
                            {log.notes && <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded">"{log.notes}"</p>}
                            {(log.quantity > 0 || log.divergence > 0) && (
                              <div className="flex gap-4 text-[10px] font-bold uppercase text-muted-foreground">
                                <span>Qtd: {log.quantity}</span>
                                {log.divergence > 0 && <span className="text-destructive">Divergência: {log.divergence}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-sm">Próxima Etapa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Quantidade Operada</Label>
                    <Input 
                      type="number" 
                      value={transitionQty} 
                      onChange={(e) => setTransitionQty(Number(e.target.value))} 
                      placeholder="Qtd real"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Divergência (Perda/Avaria)</Label>
                    <Input 
                      type="number" 
                      value={transitionDivergence} 
                      onChange={(e) => setTransitionDivergence(Number(e.target.value))} 
                      placeholder="Ex: 2 itens"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Observações / Motivos</Label>
                    <Textarea 
                      value={transitionNotes} 
                      onChange={(e) => setTransitionNotes(e.target.value)}
                      placeholder="Detalhes operacionais..."
                      className="h-20"
                    />
                  </div>
                  <Button className="w-full gap-2" onClick={handleAdvance}>
                    Avançar Workflow <MoveRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <div className="p-4 bg-muted rounded-lg text-xs space-y-2">
                <p className="font-bold flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" /> Regras do Workflow:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Reserva automática em 'RESERVADA'</li>
                  <li>Baixa da origem em 'EXPEDIDA'</li>
                  <li>Entrada no destino em 'RECEBIDA'</li>
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
