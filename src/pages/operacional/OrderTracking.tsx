import { useState } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useOrders } from '@/hooks/useOrders';
import { useOrderStatusHistory, getOrderFlowStatus, orderFlowStatuses } from '@/hooks/useOrderFlow';
import { useOrderLifecycle } from '@/hooks/useOrderLifecycle';
import { getAllowedTransitions, ORDER_FLOW_STEPS, getFlowStepIndex } from '@/lib/orderFlowEngine';
import { Search, Eye, ArrowRight, Clock, CheckCircle, XCircle, AlertTriangle, Package, Truck, FileText, Play } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/formatters';

function OrderFlowBadge({ status }: { status: string }) {
  const s = getOrderFlowStatus(status);
  return <Badge variant="outline" className={cn('font-medium border', s.color)}>{s.label}</Badge>;
}

function OrderProgressBar({ status }: { status: string }) {
  const currentIdx = getFlowStepIndex(status);
  if (status === 'cancelled') {
    return <div className="flex items-center gap-1"><XCircle className="h-4 w-4 text-destructive" /><span className="text-xs text-destructive font-medium">Cancelado</span></div>;
  }
  return (
    <div className="flex items-center gap-1 w-full">
      {ORDER_FLOW_STEPS.map((step, idx) => (
        <div key={step.key} className="flex items-center gap-1 flex-1">
          <div className={cn(
            'h-2 flex-1 rounded-full transition-colors',
            idx <= currentIdx ? 'bg-primary' : 'bg-muted'
          )} />
        </div>
      ))}
    </div>
  );
}

function OrderTimeline({ orderId }: { orderId: string }) {
  const { data: history, isLoading } = useOrderStatusHistory(orderId);
  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!history?.length) return <p className="text-sm text-muted-foreground">Nenhum histórico encontrado.</p>;

  return (
    <div className="space-y-3">
      {history.map((h: any) => (
        <div key={h.id} className="flex gap-3 items-start">
          <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
          <div className="flex-1">
            <div className="flex gap-2 items-center flex-wrap">
              {h.from_status && <OrderFlowBadge status={h.from_status} />}
              {h.from_status && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              <OrderFlowBadge status={h.to_status} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(h.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              {h.changed_by && ` • ${h.changed_by}`}
            </p>
            {h.observation && <p className="text-xs mt-1">{h.observation}</p>}
            {h.block_reason && <p className="text-xs text-destructive mt-1">Motivo: {h.block_reason}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrderTracking() {
  const { data: orders, isLoading } = useOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [transitionDialog, setTransitionDialog] = useState<{ order: any; targetStatus: string } | null>(null);
  const [observation, setObservation] = useState('');
  const lifecycle = useOrderLifecycle();

  const filtered = (orders || []).filter(o => {
    const matchSearch = !search || o.number.toLowerCase().includes(search.toLowerCase()) || o.client_name.toLowerCase().includes(search.toLowerCase());
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
      lifecycle.mutate({
        orderId: order.id,
        order,
        targetStatus,
      });
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

  const kpis = [
    { label: 'Total Pedidos', value: orders?.length || 0, icon: FileText, color: 'text-primary' },
    { label: 'Aguardando Aprovação', value: (statusCounts['awaiting_commercial_approval'] || 0) + (statusCounts['awaiting_financial_approval'] || 0) + (statusCounts['pending'] || 0), icon: Clock, color: 'text-warning' },
    { label: 'Em Andamento', value: (statusCounts['in_separation'] || 0) + (statusCounts['in_production'] || 0) + (statusCounts['awaiting_billing'] || 0), icon: Package, color: 'text-info' },
    { label: 'Bloqueados', value: statusCounts['blocked'] || 0, icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Acompanhamento de Pedidos" description="Fluxo integrado do pedido - do comercial à entrega" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <k.icon className={cn('h-8 w-8', k.color)} />
              <div>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar pedido..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {orderFlowStatuses.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell min-w-[160px]">Progresso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</TableCell></TableRow>
              ) : filtered.map(o => {
                const nextStatuses = getAllowedTransitions(o.status).filter(s => s !== 'cancelled').slice(0, 2);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-medium">{o.number}</TableCell>
                    <TableCell>{o.client_name}</TableCell>
                    <TableCell>{format(new Date(o.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>R$ {formatNumber(o.total, 2)}</TableCell>
                    <TableCell><OrderFlowBadge status={o.status} /></TableCell>
                    <TableCell className="hidden lg:table-cell"><OrderProgressBar status={o.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {nextStatuses.map(ns => (
                          <Button key={ns} variant="outline" size="sm" className="text-xs h-7 px-2"
                            onClick={e => { e.stopPropagation(); handleTransition(o, ns); }}
                            disabled={lifecycle.isPending}>
                            <Play className="h-3 w-3 mr-1" />
                            {getOrderFlowStatus(ns).label}
                          </Button>
                        ))}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setSelectedOrder(o); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Pedido {selectedOrder?.number}
              {selectedOrder && <OrderFlowBadge status={selectedOrder.status} />}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <>
              {/* Progress bar */}
              <div className="pb-2">
                <p className="text-xs text-muted-foreground mb-2">Progresso do Pedido</p>
                <div className="flex items-center gap-1">
                  {ORDER_FLOW_STEPS.map((step, idx) => {
                    const currentIdx = getFlowStepIndex(selectedOrder.status);
                    const isActive = idx <= currentIdx;
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1">
                        <div className={cn('h-2 w-full rounded-full', isActive ? 'bg-primary' : 'bg-muted')} />
                        <span className={cn('text-[10px] mt-1', isActive ? 'text-foreground font-medium' : 'text-muted-foreground')}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2 pb-2 border-b">
                {getAllowedTransitions(selectedOrder.status).map(ns => (
                  <Button key={ns} size="sm" variant={ns === 'cancelled' || ns === 'blocked' ? 'destructive' : 'default'}
                    disabled={lifecycle.isPending}
                    onClick={() => handleTransition(selectedOrder, ns)}>
                    {getOrderFlowStatus(ns).label}
                  </Button>
                ))}
              </div>
              <Tabs defaultValue="timeline">
                <TabsList className="w-full">
                  <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
                  <TabsTrigger value="details" className="flex-1">Detalhes</TabsTrigger>
                  <TabsTrigger value="items" className="flex-1">Itens</TabsTrigger>
                </TabsList>
                <TabsContent value="timeline" className="mt-4">
                  <OrderTimeline orderId={selectedOrder.id} />
                </TabsContent>
                <TabsContent value="details" className="mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Cliente:</span> {selectedOrder.client_name}</div>
                    <div><span className="text-muted-foreground">Status:</span> <OrderFlowBadge status={selectedOrder.status} /></div>
                    <div><span className="text-muted-foreground">Data:</span> {format(new Date(selectedOrder.date), 'dd/MM/yyyy')}</div>
                    <div><span className="text-muted-foreground">Entrega:</span> {selectedOrder.delivery_date ? format(new Date(selectedOrder.delivery_date), 'dd/MM/yyyy') : '-'}</div>
                    <div><span className="text-muted-foreground">Subtotal:</span> {formatBRL(selectedOrder.subtotal)}</div>
                    <div><span className="text-muted-foreground">Total:</span> {formatBRL(selectedOrder.total)}</div>

                    <div><span className="text-muted-foreground">Pgto:</span> {selectedOrder.payment_method}</div>
                    <div><span className="text-muted-foreground">Condição:</span> {selectedOrder.payment_condition}</div>
                    <div><span className="text-muted-foreground">Aprov. Comercial:</span> {selectedOrder.commercial_approval || 'Pendente'}</div>
                    <div><span className="text-muted-foreground">Aprov. Financeira:</span> {selectedOrder.financial_approval || 'Pendente'}</div>
                    {selectedOrder.separation_status && <div><span className="text-muted-foreground">Separação:</span> {selectedOrder.separation_status}</div>}
                    {selectedOrder.production_status && <div><span className="text-muted-foreground">Produção:</span> {selectedOrder.production_status}</div>}
                    {selectedOrder.billing_status && <div><span className="text-muted-foreground">Faturamento:</span> {selectedOrder.billing_status}</div>}
                    {selectedOrder.shipment_status && <div><span className="text-muted-foreground">Expedição:</span> {selectedOrder.shipment_status}</div>}
                  </div>
                </TabsContent>
                <TabsContent value="items" className="mt-4">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Código</TableHead><TableHead>Produto</TableHead><TableHead>Qtde</TableHead><TableHead>Total</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(selectedOrder.items || []).map((i: any) => (
                        <TableRow key={i.id}>
                          <TableCell className="font-mono">{i.product_code}</TableCell>
                          <TableCell>{i.product_name}</TableCell>
                          <TableCell>{i.quantity}</TableCell>
                          <TableCell>{formatBRL(i.total)}</TableCell>

                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Transition confirmation dialog (for block/cancel) */}
      <Dialog open={!!transitionDialog} onOpenChange={() => setTransitionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transitionDialog?.targetStatus === 'blocked' ? 'Bloquear Pedido' : 'Cancelar Pedido'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {transitionDialog?.targetStatus === 'blocked'
                ? 'Informe o motivo do bloqueio:'
                : 'Informe o motivo do cancelamento:'}
            </p>
            <Textarea value={observation} onChange={e => setObservation(e.target.value)}
              placeholder="Motivo..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransitionDialog(null)}>Voltar</Button>
            <Button variant="destructive" onClick={confirmTransition} disabled={!observation.trim() || lifecycle.isPending}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
