import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/ui/base/sheet';
import { Badge } from '@/ui/base/badge';
import { Card, CardContent } from '@/ui/base/card';
import { Skeleton } from '@/ui/base/skeleton';
import { Button } from '@/ui/base/button';
import { ScrollArea } from '@/ui/base/scroll-area';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Input } from '@/ui/base/input';
import { Textarea } from '@/ui/base/textarea';
import { Label } from '@/ui/base/label';
import { formatBRL, formatDate } from '@/lib/formatters';
import { useClientCommercialProfile } from '@/hooks/commercial/useClientCommercialProfile';
import { useClientTimeline } from '@/hooks/commercial/useClientTimeline';
import { useCreateFollowUp } from '@/hooks/commercial/useSalesIntelligence';
import type { DbOrder } from '@/hooks/commercial/useOrders';
import { CalendarPlus, ExternalLink, ShoppingCart } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId: string | null;
  clientName?: string;
  orders: DbOrder[];
}

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-700/20 text-amber-700',
  silver: 'bg-slate-400/20 text-slate-500',
  gold: 'bg-yellow-500/20 text-yellow-600',
  diamond: 'bg-cyan-500/20 text-cyan-600',
};

export function Client360Drawer({ open, onOpenChange, clientId, clientName, orders }: Props) {
  const { data: profile, isLoading: lp } = useClientCommercialProfile(clientId);
  const { data: timeline = [], isLoading: lt } = useClientTimeline(clientId ?? undefined);
  const createFollowUp = useCreateFollowUp();

  const [followOpen, setFollowOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string>(() =>
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  const clientOrders = useMemo(
    () => orders.filter((o) => o.client_id === clientId).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
    [orders, clientId]
  );

  const totals = useMemo(() => {
    const valid = clientOrders.filter((o) => o.status !== 'cancelled');
    return {
      count: valid.length,
      revenue: valid.reduce((s, o) => s + Number(o.total || 0), 0),
      lastDate: valid[0]?.date,
    };
  }, [clientOrders]);

  const handleCreateFollowUp = async () => {
    if (!clientId || !subject.trim()) return;
    await createFollowUp.mutateAsync({
      client_id: clientId,
      subject: subject.trim(),
      description: description.trim() || null,
      scheduled_date: new Date(scheduledDate).toISOString(),
      type: 'call',
      status: 'pending',
    });
    setSubject(''); setDescription('');
    setFollowOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="truncate">{clientName || 'Cliente'}</SheetTitle>
          <SheetDescription>Ficha comercial 360°</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Ações rápidas */}
          <div className="grid grid-cols-2 gap-2">
            <Button asChild size="sm" variant="default">
              <Link to={`/comercial/pdv?client=${clientId ?? ''}`}>
                <ShoppingCart className="mr-1 h-4 w-4" /> Novo pedido
              </Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setFollowOpen(true)} disabled={!clientId}>
              <CalendarPlus className="mr-1 h-4 w-4" /> Novo follow-up
            </Button>
          </div>

          {/* Perfil */}
          {lp ? (
            <Skeleton className="h-28" />
          ) : profile ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Badge className={tierColors[profile.tier] || ''}>{profile.tier.toUpperCase()}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Última compra: {profile.last_purchase_at ? formatDate(profile.last_purchase_at) : '—'}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">LTV 12m</p>
                    <p className="text-sm font-bold">{formatBRL(profile.ltv_12m)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Pedidos</p>
                    <p className="text-sm font-bold">{profile.order_count}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Cond. Sug.</p>
                    <p className="text-sm font-bold truncate">{profile.suggested_payment_terms || '—'}</p>
                  </div>
                </div>
                {profile.suggested_price_list_name && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Tabela sugerida: <span className="font-medium">{profile.suggested_price_list_name}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-xs text-muted-foreground">Perfil comercial ainda não calculado para este cliente.</p>
          )}

          {/* Totais do período */}
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Pedidos</p>
              <p className="text-lg font-bold">{totals.count}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Faturamento</p>
              <p className="text-lg font-bold">{formatBRL(totals.revenue)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">Último</p>
              <p className="text-sm font-semibold">{totals.lastDate ? formatDate(totals.lastDate) : '—'}</p>
            </CardContent></Card>
          </div>

          {/* Pedidos */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Últimos Pedidos
            </h4>
            <ScrollArea className="max-h-64 pr-3">
              {clientOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem pedidos no filtro atual.</p>
              ) : (
                <div className="space-y-2">
                  {clientOrders.slice(0, 15).map((o) => (
                    <Link
                      key={o.id}
                      to={`/comercial/pedidos/${o.id}/timeline`}
                      className="flex items-center justify-between rounded-lg border p-2 text-xs hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">{o.number}</p>
                        <p className="text-muted-foreground">{formatDate(o.date)} · {o.status}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatBRL(o.total)}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Timeline */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Linha do Tempo
            </h4>
            {lt ? (
              <Skeleton className="h-24" />
            ) : timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem eventos registrados.</p>
            ) : (
              <ScrollArea className="max-h-56 pr-3">
                <div className="space-y-2">
                  {timeline.slice(0, 20).map((e) => (
                    <div key={e.id} className="rounded-lg border p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{e.title}</span>
                        <span className="text-muted-foreground">{formatDate(e.created_at)}</span>
                      </div>
                      {e.description && <p className="mt-1 text-muted-foreground">{e.description}</p>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link to={`/comercial/clientes`}>Abrir cadastro completo</Link>
          </Button>
        </div>

        {/* Follow-up dialog */}
        <Dialog open={followOpen} onOpenChange={setFollowOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo follow-up · {clientName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="fu-subject">Assunto *</Label>
                <Input id="fu-subject" value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex.: Retomar proposta" />
              </div>
              <div>
                <Label htmlFor="fu-date">Data agendada *</Label>
                <Input id="fu-date" type="datetime-local" value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="fu-desc">Observações</Label>
                <Textarea id="fu-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFollowOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateFollowUp}
                disabled={!subject.trim() || createFollowUp.isPending}>
                {createFollowUp.isPending ? 'Salvando…' : 'Agendar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
