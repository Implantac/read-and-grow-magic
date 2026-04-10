import { useState } from 'react';
import { ClientAIWidget } from './ClientAIWidget';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useClientTimeline, useCreateTimelineEvent, TIMELINE_EVENT_TYPES } from '@/hooks/useClientTimeline';
import { useOrders } from '@/hooks/useOrders';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useSalesFunnel } from '@/hooks/useSalesFunnel';
import { type DbClient } from '@/hooks/useClients';
import {
  Phone, MapPin, FileText, ShoppingCart, StickyNote, Clock, AlertTriangle,
  DollarSign, Plus, RotateCcw, Handshake, TrendingUp, Target, CreditCard,
  Star, BarChart3,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getOrderStatusLabel, getPaymentMethodLabel } from '@/config/commercial';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const EVENT_ICONS: Record<string, React.ReactNode> = {
  contact: <Phone className="h-3.5 w-3.5" />,
  visit: <MapPin className="h-3.5 w-3.5" />,
  negotiation: <Handshake className="h-3.5 w-3.5" />,
  proposal: <FileText className="h-3.5 w-3.5" />,
  order: <ShoppingCart className="h-3.5 w-3.5" />,
  return: <RotateCcw className="h-3.5 w-3.5" />,
  issue: <AlertTriangle className="h-3.5 w-3.5" />,
  note: <StickyNote className="h-3.5 w-3.5" />,
  followup: <Clock className="h-3.5 w-3.5" />,
};

const SCORE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  high: { label: 'Alto Potencial', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <Star className="h-3 w-3" /> },
  medium: { label: 'Médio', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <TrendingUp className="h-3 w-3" /> },
  low: { label: 'Baixo', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: <Target className="h-3 w-3" /> },
};

interface Props {
  client: DbClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailDialog({ client, open, onOpenChange }: Props) {
  const { data: timeline = [], isLoading: tlLoading } = useClientTimeline(client?.id);
  const { data: allOrders = [] } = useOrders();
  const { data: allReceivables = [] } = useAccountsReceivable();
  const { data: allFunnel = [] } = useSalesFunnel();
  const createEvent = useCreateTimelineEvent();
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ event_type: 'note', title: '', description: '' });

  const handleAddEvent = async () => {
    if (!client || !eventForm.title) return;
    await createEvent.mutateAsync({
      client_id: client.id,
      event_type: eventForm.event_type,
      title: eventForm.title,
      description: eventForm.description || null,
    });
    setEventForm({ event_type: 'note', title: '', description: '' });
    setShowEventForm(false);
  };

  if (!client) return null;

  const clientOrders = allOrders.filter(o => o.client_id === client.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const clientReceivables = allReceivables.filter(r => r.client_id === client.id);
  const clientFunnel = allFunnel.filter(f => f.client_id === client.id && f.status === 'open');

  const creditUsage = client.credit_limit > 0 ? (client.current_balance / client.credit_limit) * 100 : 0;
  const daysSinceLastPurchase = client.last_purchase_date ? differenceInDays(new Date(), new Date(client.last_purchase_date)) : null;
  const scoreConfig = SCORE_CONFIG[client.client_score || 'medium'];

  const totalReceivable = clientReceivables.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
  const overdueReceivable = clientReceivables.filter(r => r.status === 'overdue' || (r.status === 'pending' && new Date(r.due_date) < new Date())).reduce((s, r) => s + r.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 flex-wrap">
            <span className="text-lg">{client.name}</span>
            <StatusBadge type="client" status={client.status} />
            {client.abc_classification && (
              <Badge variant={client.abc_classification === 'A' ? 'default' : 'secondary'} className="text-xs font-bold">
                {client.abc_classification}
              </Badge>
            )}
            <Badge className={`text-[10px] gap-1 ${scoreConfig.color}`}>
              {scoreConfig.icon} {scoreConfig.label}
            </Badge>
          </DialogTitle>
          {client.trade_name && <p className="text-sm text-muted-foreground">{client.trade_name}</p>}
        </DialogHeader>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Total Compras</p>
            <p className="text-sm font-bold text-primary">{fmt(client.total_purchases || 0)}</p>
          </div>
          <div className="rounded-lg border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Ticket Médio</p>
            <p className="text-sm font-bold">{fmt(client.avg_ticket || 0)}</p>
          </div>
          <div className="rounded-lg border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Pedidos</p>
            <p className="text-sm font-bold">{clientOrders.length}</p>
          </div>
          <div className="rounded-lg border p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">Última Compra</p>
            <p className={`text-sm font-bold ${daysSinceLastPurchase && daysSinceLastPurchase > 90 ? 'text-destructive' : ''}`}>
              {daysSinceLastPurchase !== null ? `${daysSinceLastPurchase}d` : '—'}
            </p>
          </div>
        </div>

        {/* Credit Usage */}
        {client.credit_limit > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Crédito: {fmt(client.current_balance)} / {fmt(client.credit_limit)}</span>
              <span className={`font-medium ${creditUsage > 80 ? 'text-destructive' : ''}`}>{creditUsage.toFixed(0)}%</span>
            </div>
            <Progress value={Math.min(creditUsage, 100)} className="h-1.5" />
          </div>
        )}

        <Tabs defaultValue="info" className="mt-1">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info" className="text-xs">Dados</TabsTrigger>
            <TabsTrigger value="commercial" className="text-xs">Comercial</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">Pedidos ({clientOrders.length})</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs">Financeiro</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">Histórico ({timeline.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground block text-xs">Código</span><p className="font-mono">{client.code}</p></div>
              <div><span className="text-muted-foreground block text-xs">{client.document_type === 'cnpj' ? 'CNPJ' : 'CPF'}</span><p>{client.document}</p></div>
              <div><span className="text-muted-foreground block text-xs">E-mail</span><p>{client.email}</p></div>
              <div><span className="text-muted-foreground block text-xs">Telefone</span><p>{client.phone}{client.cellphone ? ` / ${client.cellphone}` : ''}</p></div>
              {client.state_registration && <div><span className="text-muted-foreground block text-xs">IE</span><p>{client.state_registration}</p></div>}
              {client.municipal_registration && <div><span className="text-muted-foreground block text-xs">IM</span><p>{client.municipal_registration}</p></div>}
            </div>
            <div className="border-t pt-3 text-sm">
              <span className="text-muted-foreground block text-xs mb-1">Endereço</span>
              <p>{client.address_street}, {client.address_number}{client.address_complement ? ` - ${client.address_complement}` : ''}</p>
              <p>{client.address_neighborhood} - {client.address_city}/{client.address_state} - CEP: {client.address_zip_code}</p>
            </div>
            {client.segment && (
              <div className="text-sm"><span className="text-muted-foreground block text-xs">Segmento</span><p>{client.segment}</p></div>
            )}
          </TabsContent>

          <TabsContent value="commercial" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground block text-xs">Limite de Crédito</span>
                <p className="text-lg font-semibold">{fmt(client.credit_limit)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground block text-xs">Saldo Atual</span>
                <p className={`text-lg font-semibold ${creditUsage > 80 ? 'text-destructive' : ''}`}>{fmt(client.current_balance)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><span className="text-muted-foreground block text-xs">Condição de Pagamento</span><p>{client.default_payment_condition || 'À vista'}</p></div>
              <div><span className="text-muted-foreground block text-xs">Tabela de Preço</span><p>{client.price_table || 'Padrão'}</p></div>
              <div><span className="text-muted-foreground block text-xs">Potencial Estimado</span><p>{fmt(client.estimated_potential || 0)}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground block text-xs">Região</span><p>{client.region || '—'}</p></div>
              <div><span className="text-muted-foreground block text-xs">Micro-Região</span><p>{client.micro_region || '—'}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground block text-xs">Frequência de Compra</span><p>{client.purchase_frequency || 0} pedidos/mês</p></div>
              <div><span className="text-muted-foreground block text-xs">Última Compra</span>
                <p>{client.last_purchase_date ? format(new Date(client.last_purchase_date), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</p>
              </div>
            </div>

            {/* Open Opportunities */}
            {clientFunnel.length > 0 && (
              <div className="border-t pt-3">
                <h4 className="text-xs font-medium uppercase text-muted-foreground mb-2 flex items-center gap-1"><Target className="h-3 w-3" /> Oportunidades Abertas ({clientFunnel.length})</h4>
                <div className="space-y-2">
                  {clientFunnel.map(f => (
                    <div key={f.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                      <div>
                        <p className="font-medium">{f.title}</p>
                        <p className="text-xs text-muted-foreground">{f.stage} • {f.probability}%</p>
                      </div>
                      <span className="font-semibold text-primary">{fmt(f.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Widget */}
            <ClientAIWidget clientId={client.id} />

            {client.commercial_notes && (
              <div className="text-sm border-t pt-3"><span className="text-muted-foreground block text-xs">Observações Comerciais</span><p>{client.commercial_notes}</p></div>
            )}
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="mt-4">
            {clientOrders.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum pedido encontrado</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {clientOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between border rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{order.number}</span>
                          <StatusBadge type="order" status={order.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.date), 'dd/MM/yyyy', { locale: ptBR })}
                          {order.items && ` • ${order.items.length} itens`}
                          {' • '}{getPaymentMethodLabel(order.payment_method as any)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold">{fmt(order.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FINANCIAL TAB */}
          <TabsContent value="financial" className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">A Receber</p>
                <p className="text-lg font-bold text-primary">{fmt(totalReceivable)}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Vencido</p>
                <p className={`text-lg font-bold ${overdueReceivable > 0 ? 'text-destructive' : ''}`}>{fmt(overdueReceivable)}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Total Títulos</p>
                <p className="text-lg font-bold">{clientReceivables.length}</p>
              </div>
            </div>
            {clientReceivables.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">Nenhum título encontrado</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {clientReceivables.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).map(r => {
                  const isOverdue = r.status === 'pending' && new Date(r.due_date) < new Date();
                  return (
                    <div key={r.id} className={`flex items-center justify-between border rounded-lg px-4 py-2.5 ${isOverdue ? 'border-destructive/30 bg-destructive/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <DollarSign className={`h-4 w-4 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="text-sm font-medium">{r.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {format(new Date(r.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                            {r.invoice_number && ` • NF ${r.invoice_number}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{fmt(r.amount)}</p>
                        <Badge variant={r.status === 'paid' ? 'default' : isOverdue ? 'destructive' : 'secondary'} className="text-[10px]">
                          {r.status === 'paid' ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TIMELINE TAB */}
          <TabsContent value="timeline" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button variant="outline" size="sm" onClick={() => setShowEventForm(!showEventForm)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Registrar Evento
              </Button>
            </div>

            {showEventForm && (
              <div className="border rounded-lg p-3 mb-4 space-y-2 bg-muted/30">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={eventForm.event_type} onValueChange={v => setEventForm(p => ({ ...p, event_type: v }))}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMELINE_EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Título *</Label>
                    <Input className="h-8 text-xs" value={eventForm.title} onChange={e => setEventForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Descrição</Label>
                  <Textarea className="text-xs" rows={2} value={eventForm.description} onChange={e => setEventForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setShowEventForm(false)}>Cancelar</Button>
                  <Button size="sm" onClick={handleAddEvent} disabled={createEvent.isPending}>Salvar</Button>
                </div>
              </div>
            )}

            {tlLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : timeline.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Nenhum evento registrado</p>
            ) : (
              <div className="relative space-y-0 max-h-[350px] overflow-y-auto">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
                {timeline.map(ev => (
                  <div key={ev.id} className="relative pl-10 py-2.5">
                    <div className="absolute left-2.5 top-3.5 w-3 h-3 rounded-full bg-background border-2 border-primary flex items-center justify-center" />
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 text-muted-foreground">{EVENT_ICONS[ev.event_type] || <StickyNote className="h-3.5 w-3.5" />}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{ev.title}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            {TIMELINE_EVENT_TYPES.find(t => t.value === ev.event_type)?.label || ev.event_type}
                          </Badge>
                        </div>
                        {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(ev.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          {ev.user_name && ` • ${ev.user_name}`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
