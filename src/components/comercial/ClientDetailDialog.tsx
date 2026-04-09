import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientTimeline, useCreateTimelineEvent, TIMELINE_EVENT_TYPES } from '@/hooks/useClientTimeline';
import { type DbClient } from '@/hooks/useClients';
import {
  Phone, MapPin, FileText, ShoppingCart, StickyNote, Clock, AlertTriangle,
  DollarSign, Plus, RotateCcw, Handshake,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface Props {
  client: DbClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailDialog({ client, open, onOpenChange }: Props) {
  const { data: timeline = [], isLoading: tlLoading } = useClientTimeline(client?.id);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{client.name}</span>
            <StatusBadge type="client" status={client.status} />
            {client.abc_classification && (
              <Badge variant="outline" className="text-xs">ABC: {client.abc_classification}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Dados</TabsTrigger>
            <TabsTrigger value="commercial">Comercial</TabsTrigger>
            <TabsTrigger value="timeline">Histórico ({timeline.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground block text-xs">Código</span><p className="font-mono">{client.code}</p></div>
              <div><span className="text-muted-foreground block text-xs">{client.document_type === 'cnpj' ? 'CNPJ' : 'CPF'}</span><p>{client.document}</p></div>
              {client.trade_name && <div className="col-span-2"><span className="text-muted-foreground block text-xs">Nome Fantasia</span><p>{client.trade_name}</p></div>}
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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground block text-xs">Limite de Crédito</span>
                <p className="text-lg font-semibold">{fmt(client.credit_limit)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground block text-xs">Saldo Atual</span>
                <p className="text-lg font-semibold">{fmt(client.current_balance)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground block text-xs">Total de Compras</span>
                <p className="text-lg font-semibold">{fmt(client.total_purchases || 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground block text-xs">Ticket Médio</span>
                <p className="text-lg font-semibold">{fmt(client.avg_ticket || 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground block text-xs">Condição de Pagamento</span><p>{client.default_payment_condition || 'À vista'}</p></div>
              <div><span className="text-muted-foreground block text-xs">Tabela de Preço</span><p>{client.price_table || 'Padrão'}</p></div>
              <div><span className="text-muted-foreground block text-xs">Potencial Estimado</span><p>{fmt(client.estimated_potential || 0)}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground block text-xs">Região</span><p>{client.region || '—'}</p></div>
              <div><span className="text-muted-foreground block text-xs">Micro-Região</span><p>{client.micro_region || '—'}</p></div>
            </div>
            {client.last_purchase_date && (
              <div className="text-sm"><span className="text-muted-foreground block text-xs">Última Compra</span><p>{format(new Date(client.last_purchase_date), 'dd/MM/yyyy', { locale: ptBR })}</p></div>
            )}
            {client.commercial_notes && (
              <div className="text-sm border-t pt-3"><span className="text-muted-foreground block text-xs">Observações Comerciais</span><p>{client.commercial_notes}</p></div>
            )}
          </TabsContent>

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
              <div className="relative space-y-0">
                <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
                {timeline.map(ev => (
                  <div key={ev.id} className="relative pl-10 py-2.5">
                    <div className="absolute left-2.5 top-3.5 w-3 h-3 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    </div>
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
