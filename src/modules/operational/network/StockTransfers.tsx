import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Truck, Plus, ArrowRight, Clock, CheckCircle2, AlertTriangle, List, History, ClipboardCheck, PackageCheck, Send, User, Calendar, XCircle, Ban } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { ScrollArea } from '@/ui/base/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui/base/dialog';
import { transferWorkflow, TransferStatus, nextStatuses } from '@/services/operational/inventory/transferWorkflow';
import { toast } from 'sonner';
import { Textarea } from '@/ui/base/textarea';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { useTransferOrdersList, useTransferActions } from '@/hooks/operational/network/useTransfers';
import { NewTransferDialog } from './components/NewTransferDialog';

const workflowSteps: { status: TransferStatus, label: string, icon: any, color: string }[] = [
  { status: 'SUGERIDA', label: 'Sugerida', icon: Clock, color: 'bg-slate-500' },
  { status: 'APROVADA', label: 'Aprovada', icon: ClipboardCheck, color: 'bg-blue-500' },
  { status: 'RESERVADA', label: 'Reservada', icon: List, color: 'bg-indigo-500' },
  { status: 'SEPARAÇÃO', label: 'Separação', icon: PackageCheck, color: 'bg-amber-500' },
  { status: 'CONFERÊNCIA', label: 'Conferência', icon: ClipboardCheck, color: 'bg-orange-500' },
  { status: 'EXPEDIDA', label: 'Expedida', icon: Send, color: 'bg-purple-500' },
  { status: 'EM TRÂNSITO', label: 'Em Trânsito', icon: Truck, color: 'bg-violet-500' },
  { status: 'RECEBIDA', label: 'Recebida', icon: ArrowRight, color: 'bg-cyan-500' },
  { status: 'RECEBIDA PARCIAL', label: 'Recebida Parcial', icon: AlertTriangle, color: 'bg-amber-600' },
  { status: 'RECEBIDA COM DIVERGÊNCIA', label: 'Recebida c/ Divergência', icon: AlertTriangle, color: 'bg-destructive' },
  { status: 'CONFERIDA', label: 'Conferida', icon: CheckCircle2, color: 'bg-emerald-500' },
  { status: 'ENCERRADA', label: 'Encerrada', icon: CheckCircle2, color: 'bg-green-600' },
  { status: 'REJEITADA', label: 'Rejeitada', icon: XCircle, color: 'bg-destructive' },
  { status: 'CANCELADA', label: 'Cancelada', icon: Ban, color: 'bg-muted-foreground' },
];

const stepFor = (status?: string) =>
  workflowSteps.find((s) => s.status === status) || workflowSteps[0];

export default function StockTransfersPage() {
  const { data: transfers, isLoading } = useTransferOrdersList();
  const { advance, isAdvancing } = useTransferActions();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isNewOpen, setIsNewOpen] = useState(false);

  const handleOpenDetails = async (order: any) => {
    setSelectedOrder(order);
    setNotes('');
    const initial: Record<string, number> = {};
    (order.items || []).forEach((item: any) => {
      initial[item.id] = Number(item.shipped_qty ?? item.requested_qty ?? 0);
    });
    setQuantities(initial);
    try {
      setHistory(await transferWorkflow.getHistory(order.id));
    } catch {
      toast.error('Erro ao carregar histórico');
    }
  };

  const handleTransition = async (toStatus: TransferStatus) => {
    if (!selectedOrder) return;
    try {
      await advance({
        transferId: selectedOrder.id,
        toStatus,
        notes,
        correlationId: selectedOrder.correlation_id || undefined,
        itemQuantities: (selectedOrder.items || []).map((item: any) => ({
          itemId: item.id,
          quantity: Number(quantities[item.id] ?? item.requested_qty ?? 0),
        })),
      });
      setSelectedOrder(null);
    } catch {
      /* erro já notificado */
    }
  };

  const current: TransferStatus = (selectedOrder?.current_status || 'SUGERIDA') as TransferStatus;
  const options = nextStatuses(current);

  return (
    <PageContainer loading={isLoading}>
      <PageHeader
        title="Transferências de Estoque"
        description="Gestão de movimentações entre lojas, centros de distribuição e fábricas"
      >
        <Button onClick={() => setIsNewOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Transferência
        </Button>
      </PageHeader>

      <NewTransferDialog open={isNewOpen} onOpenChange={setIsNewOpen} />

      <div className="grid gap-6">
        {transfers && transfers.length > 0 ? (
          <div className="space-y-4">
            {transfers.map((order: any) => {
              const step = stepFor(order.current_status);
              const units = (order.items || []).reduce((s: number, i: any) => s + Number(i.requested_qty || 0), 0);
              return (
                <Card key={order.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => handleOpenDetails(order)}>
                  <CardContent className="p-4">
                    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                      <div className="flex items-center gap-4">
                        <div className={`rounded-full p-2 ${step.color} bg-opacity-10`}>
                          <step.icon className="h-5 w-5 text-current" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold">TRF-{String(order.order_number || '').padStart(5, '0')}</span>
                            <Badge className={step.color}>{step.label}</Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{order.origin?.name || 'Origem'}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span>{order.destination?.name || 'Destino'}</span>
                            <span>• {order.items?.length || 0} produto(s) / {units} un.</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex w-full items-center justify-between gap-4 md:w-auto">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Última atualização</p>
                          <p className="text-sm font-medium">{new Date(order.updated_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <Button variant="outline" size="sm">Gerenciar</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Truck}
            title="Nenhuma transferência"
            description="Crie uma transferência para movimentar mercadoria entre suas unidades."
            action={{ label: 'Nova Transferência', onClick: () => setIsNewOpen(true), icon: Plus }}
          />
        )}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Transferência TRF-{String(selectedOrder?.order_number || '').padStart(5, '0')}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.origin?.name} → {selectedOrder?.destination?.name} • Situação atual: {stepFor(current).label}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4 md:grid-cols-3">
            <div className="space-y-6 md:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Produtos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(selectedOrder?.items || []).map((item: any) => (
                    <div key={item.id} className="flex items-end gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product?.name || 'Produto'}</p>
                        <p className="text-xs text-muted-foreground">
                          Solicitado: {item.requested_qty}
                          {item.shipped_qty != null && ` • Enviado: ${item.shipped_qty}`}
                          {item.received_qty != null && ` • Recebido: ${item.received_qty}`}
                        </p>
                      </div>
                      <div className="w-28 space-y-1">
                        <Label className="text-[10px]">Quantidade</Label>
                        <Input
                          type="number"
                          min={0}
                          value={quantities[item.id] ?? 0}
                          onChange={(e) => setQuantities({ ...quantities, [item.id]: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  ))}
                  {(selectedOrder?.items || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">Esta transferência não possui produtos.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <History className="h-4 w-4" /> Histórico operacional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[240px] pr-4">
                    <div className="space-y-4">
                      {history.map((log: any) => (
                        <div key={log.id} className="relative border-l-2 border-muted pl-4">
                          <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-muted bg-background" />
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px]">{log.status}</Badge>
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="h-3 w-3" /> {new Date(log.created_at).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                            <User className="h-3 w-3" /> {log.profiles?.name || 'Sistema'}
                          </p>
                          {log.notes && <p className="mt-1 rounded bg-muted/50 p-2 text-xs italic text-muted-foreground">"{log.notes}"</p>}
                          {(log.quantity > 0 || log.divergence > 0) && (
                            <div className="mt-1 flex gap-4 text-[10px] font-bold uppercase text-muted-foreground">
                              <span>Qtd: {log.quantity}</span>
                              {log.divergence > 0 && <span className="text-destructive">Divergência: {log.divergence}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                      {history.length === 0 && <p className="text-sm text-muted-foreground">Sem movimentações registradas.</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Próxima etapa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Observações / Motivos</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes operacionais..." className="h-20" />
                  </div>
                  {options.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Esta transferência está encerrada.</p>
                  ) : (
                    options.map((status) => (
                      <Button
                        key={status}
                        className="w-full"
                        variant={status === 'CANCELADA' || status === 'REJEITADA' ? 'outline' : 'default'}
                        disabled={isAdvancing}
                        onClick={() => handleTransition(status)}
                      >
                        {stepFor(status).label}
                      </Button>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="space-y-2 rounded-lg bg-muted p-4 text-xs">
                <p className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-3 w-3" /> Regras
                </p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Reserva na origem em "Reservada"</li>
                  <li>Baixa da origem e entrada em trânsito em "Expedida"</li>
                  <li>Entrada no destino no recebimento, produto a produto</li>
                  <li>Diferença entre enviado e recebido gera divergência</li>
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
