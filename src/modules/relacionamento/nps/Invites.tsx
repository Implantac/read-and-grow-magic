import { useMemo, useState } from 'react';
import { useNPSCampaigns, useNPSInvites, useGenerateInvites, publicSurveyUrl } from './hooks';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Skeleton } from '@/ui/base/skeleton';
import { Badge } from '@/ui/base/badge';
import { Checkbox } from '@/ui/base/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Send, Copy, MessageCircle, Mail, Link2, QrCode, Search, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeDialog } from './QRCodeDialog';

const CHANNELS = [
  { v: 'link', label: 'Link manual', icon: Link2 },
  { v: 'email', label: 'E-mail', icon: Mail },
  { v: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { v: 'sms', label: 'SMS', icon: MessageCircle },
  { v: 'qr', label: 'QR Code', icon: QrCode },
];

export default function Invites() {
  const { data: campaigns = [] } = useNPSCampaigns();
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const { data: invites = [], isLoading } = useNPSInvites(campaignId);
  const generate = useGenerateInvites();
  const { currentCompany } = useEnterprise() as any;
  const activeCompanyId = currentCompany?.id;
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState('link');
  const [expiresDays, setExpiresDays] = useState<number>(30);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['nps', 'clients-picker', activeCompanyId, search],
    enabled: !!activeCompanyId && open,
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id,name,email,phone,address_city,segment')
        .eq('company_id', activeCompanyId)
        .ilike('name', `%${search}%`)
        .limit(50);
      return data ?? [];
    },
  });

  const filteredInvites = useMemo(() => {
    return (invites as any[]).filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (channelFilter !== 'all' && i.channel !== channelFilter) return false;
      return true;
    });
  }, [invites, statusFilter, channelFilter]);

  const tokensByInvite = useTokensMap(filteredInvites);

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nps_invites').update({ status: 'revoked' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Convite revogado'); },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    const total = filteredInvites.length;
    const responded = filteredInvites.filter((i: any) => i.status === 'responded').length;
    const pending = filteredInvites.filter((i: any) => i.status === 'pending').length;
    const revoked = filteredInvites.filter((i: any) => i.status === 'revoked').length;
    return { total, responded, pending, revoked, rate: total ? Math.round((responded / total) * 100) : 0 };
  }, [filteredInvites]);

  const submit = () => {
    if (!campaignId || selected.size === 0) return;
    generate.mutate(
      { campaign_id: campaignId, client_ids: Array.from(selected), channel, expires_in_days: expiresDays },
      { onSuccess: () => { setOpen(false); setSelected(new Set()); } },
    );
  };

  const toggleAllVisible = (checked: boolean) => {
    const s = new Set(selected);
    (clients as any[]).forEach((c) => {
      if (checked) s.add(c.id); else s.delete(c.id);
    });
    setSelected(s);
  };

  const shareUrl = (token: string, ch: string, contact?: { email?: string | null; phone?: string | null; name?: string | null }) => {
    const link = publicSurveyUrl(token);
    if (ch === 'whatsapp' && contact?.phone) {
      const msg = encodeURIComponent(`Olá ${contact.name ?? ''}, sua opinião é muito importante para nós. Responda em 1 minuto: ${link}`);
      const phone = contact.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
      return;
    }
    if (ch === 'email' && contact?.email) {
      const subj = encodeURIComponent('Sua opinião conta');
      const body = encodeURIComponent(`Olá ${contact.name ?? ''},\n\nSua opinião é muito importante. Responda em 1 minuto:\n${link}`);
      window.open(`mailto:${contact.email}?subject=${subj}&body=${body}`, '_self');
      return;
    }
    navigator.clipboard.writeText(link);
    toast.success('Link copiado');
  };

  const sendPending = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('nps-send-invite', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success(`Enviados: ${d?.sent ?? 0} · Falhas: ${d?.failed ?? 0}`); },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao enviar'),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">Convites</h2>
          <p className="text-sm text-muted-foreground">Envie a pesquisa por link, e-mail, WhatsApp, SMS ou QR Code.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => sendPending.mutate()} disabled={sendPending.isPending}>
            <Mail className="mr-2 h-4 w-4" /> Enviar pendentes por e-mail
          </Button>
          <Button onClick={() => setOpen(true)} disabled={!campaignId}><Send className="mr-2 h-4 w-4" /> Gerar convites</Button>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <Label>Campanha</Label>
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{campaigns.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
              <SelectItem value="responded">Respondido</SelectItem>
              <SelectItem value="revoked">Revogado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Canal</Label>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {CHANNELS.map((c) => <SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Card>
          <CardContent className="pt-4 pb-4 text-xs flex justify-between items-center">
            <div><div className="text-muted-foreground">Total</div><div className="text-lg font-semibold">{stats.total}</div></div>
            <div><div className="text-muted-foreground">Respondidos</div><div className="text-lg font-semibold text-green-500">{stats.responded}</div></div>
            <div><div className="text-muted-foreground">Taxa</div><div className="text-lg font-semibold">{stats.rate}%</div></div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? <Skeleton className="h-64" /> : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Campanha</th>
                  <th className="text-left p-3">Canal</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Criado</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvites.map((i: any) => {
                  const tk = tokensByInvite.get(i.id);
                  return (
                    <tr key={i.id} className="border-t border-border hover:bg-muted/20">
                      <td className="p-3">
                        <div className="font-medium">{i.clients?.name ?? '—'}</div>
                      </td>
                      <td className="p-3 text-muted-foreground">{i.nps_campaigns?.name}</td>
                      <td className="p-3"><Badge variant="outline">{i.channel}</Badge></td>
                      <td className="p-3"><StatusBadge status={i.status} /></td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(i.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {tk && (
                            <>
                              <Button size="sm" variant="ghost" title="Copiar link" onClick={() => { navigator.clipboard.writeText(publicSurveyUrl(tk)); toast.success('Link copiado'); }}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" title="WhatsApp" onClick={() => shareUrl(tk, 'whatsapp', i.clients)}>
                                <MessageCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" title="E-mail" onClick={() => shareUrl(tk, 'email', i.clients)}>
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" title="QR Code" onClick={() => setQrUrl(publicSurveyUrl(tk))}>
                                <QrCode className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {i.status !== 'responded' && i.status !== 'revoked' && (
                            <Button size="sm" variant="ghost" title="Revogar" onClick={() => revoke.mutate(i.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredInvites.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {campaignId ? 'Nenhum convite com esses filtros.' : 'Selecione uma campanha para começar.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Gerar convites</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Canal de envio</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CHANNELS.map((c) => <SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Link válido por (dias)</Label>
                <Input type="number" min={1} max={365} value={expiresDays} onChange={(e) => setExpiresDays(Number(e.target.value) || 30)} />
              </div>
            </div>

            <div>
              <Label>Buscar cliente</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome do cliente…" className="pl-8" />
              </div>
            </div>

            {clients.length > 0 && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={clients.every((c: any) => selected.has(c.id))}
                  onCheckedChange={(v) => toggleAllVisible(!!v)}
                />
                Selecionar todos os {clients.length} visíveis
              </label>
            )}

            <div className="max-h-64 overflow-y-auto border rounded">
              {clients.map((c: any) => {
                const hasEmail = !!c.email;
                const hasPhone = !!c.phone;
                const invalid = (channel === 'email' && !hasEmail) || ((channel === 'whatsapp' || channel === 'sms') && !hasPhone);
                return (
                  <label key={c.id} className={`flex items-center gap-2 p-2 hover:bg-muted cursor-pointer border-b border-border last:border-0 ${invalid ? 'opacity-60' : ''}`}>
                    <Checkbox
                      checked={selected.has(c.id)}
                      onCheckedChange={(v) => { const s = new Set(selected); v ? s.add(c.id) : s.delete(c.id); setSelected(s); }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {c.email ?? '—'} · {c.phone ?? '—'} {c.address_city ? `· ${c.address_city}` : ''}
                      </div>
                    </div>
                    {invalid && <Badge variant="outline" className="text-xs">sem contato</Badge>}
                  </label>
                );
              })}
              {clients.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              {selected.size} selecionado(s). Após gerar, você poderá copiar o link ou disparar pelo WhatsApp/e-mail direto da lista.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={selected.size === 0 || generate.isPending}>
              {generate.isPending ? <RotateCcw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Gerar {selected.size} convite(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QRCodeDialog open={!!qrUrl} onOpenChange={(v) => !v && setQrUrl(null)} url={qrUrl ?? ''} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: any }> = {
    pending: { label: 'Pendente', variant: 'secondary' },
    sent: { label: 'Enviado', variant: 'default' },
    responded: { label: 'Respondido', variant: 'default' },
    revoked: { label: 'Revogado', variant: 'outline' },
  };
  const s = map[status] ?? { label: status, variant: 'outline' };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function useTokensMap(invites: any[]) {
  const inviteIds = useMemo(() => invites.map((i) => i.id), [invites]);
  const { data } = useQuery({
    queryKey: ['nps', 'tokens', inviteIds.join(',')],
    enabled: inviteIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('nps_tokens').select('invite_id,token').in('invite_id', inviteIds);
      return data ?? [];
    },
  });
  return useMemo(() => {
    const m = new Map<string, string>();
    (data ?? []).forEach((t: any) => { if (t.invite_id) m.set(t.invite_id, t.token); });
    return m;
  }, [data]);
}
