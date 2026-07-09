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
import { Send, Copy, MessageCircle, Mail, Link2, QrCode, Search, RotateCcw, Trash2, RefreshCw, Download, ChevronLeft, ChevronRight, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeDialog } from './QRCodeDialog';
import { exportToCSV } from '@/lib/exportUtils';
import { useConfirm } from '@/shared/components/ConfirmDialog';

type BulkResultItem = { id: string; name: string; ok: boolean; error?: string };
type BulkResult = { title: string; items: BulkResultItem[] } | null;

const CHANNELS = [
  { v: 'link', label: 'Link manual', icon: Link2 },
  { v: 'email', label: 'E-mail', icon: Mail },
  { v: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { v: 'sms', label: 'SMS', icon: MessageCircle },
  { v: 'qr', label: 'QR Code', icon: QrCode },
];

const PAGE_SIZE = 20;

export default function Invites() {
  const { data: campaigns = [], isLoading: campaignsLoading } = useNPSCampaigns();
  const [campaignId, setCampaignId] = useState<string | undefined>();
  useEffect(() => {
    if (!campaignId && campaigns.length > 0) setCampaignId((campaigns[0] as any).id);
  }, [campaigns, campaignId]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [textFilter, setTextFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data: invites = [], isLoading } = useNPSInvites(campaignId);
  const generate = useGenerateInvites();
  const { currentCompany } = useEnterprise() as any;
  const activeCompanyId = currentCompany?.id;
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState('link');
  const [expiresDays, setExpiresDays] = useState<number>(30);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const [selectedInvites, setSelectedInvites] = useState<Set<string>>(new Set());
  const [bulkResult, setBulkResult] = useState<BulkResult>(null);
  const confirm = useConfirm();

  const inviteNameById = (id: string) => {
    const inv = (invites as any[]).find((i) => i.id === id);
    return inv?.clients?.name || inv?.clients?.email || inv?.clients?.phone || id.slice(0, 8);
  };

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
    const q = textFilter.trim().toLowerCase();
    return (invites as any[]).filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (channelFilter !== 'all' && i.channel !== channelFilter) return false;
      if (q) {
        const name = (i.clients?.name ?? '').toLowerCase();
        const email = (i.clients?.email ?? '').toLowerCase();
        const phone = (i.clients?.phone ?? '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });
  }, [invites, statusFilter, channelFilter, textFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvites.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageInvites = useMemo(
    () => filteredInvites.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredInvites, currentPage],
  );

  const tokensByInvite = useTokensMap(pageInvites);

  const revoke = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map(async (id) => {
          const { error } = await supabase.from('nps_invites').update({ status: 'revoked' }).eq('id', id);
          return { id, name: inviteNameById(id), ok: !error, error: error?.message };
        }),
      );
      return results;
    },
    onSuccess: (items) => {
      qc.invalidateQueries({ queryKey: ['nps'] });
      const ok = items.filter((r) => r.ok).length;
      const fail = items.length - ok;
      if (fail === 0) toast.success(`${ok} convite(s) revogado(s)`);
      else toast.error(`${ok} revogado(s) · ${fail} falha(s)`);
      if (fail > 0) setBulkResult({ title: 'Resultado da revogação', items });
      setSelectedInvites(new Set());
    },
    onError: (e: any) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    const total = filteredInvites.length;
    const sent = filteredInvites.filter((i: any) => ['sent', 'opened', 'responded'].includes(i.status)).length;
    const opened = filteredInvites.filter((i: any) => ['opened', 'responded'].includes(i.status)).length;
    const responded = filteredInvites.filter((i: any) => i.status === 'responded').length;
    const pending = filteredInvites.filter((i: any) => i.status === 'pending').length;
    const bounced = filteredInvites.filter((i: any) => i.status === 'bounced' || i.status === 'failed').length;
    const revoked = filteredInvites.filter((i: any) => i.status === 'revoked').length;
    return {
      total, sent, opened, responded, pending, bounced, revoked,
      openRate: sent ? Math.round((opened / sent) * 100) : 0,
      responseRate: sent ? Math.round((responded / sent) * 100) : 0,
    };
  }, [filteredInvites]);

  const submit = () => {
    if (!campaignId || selectedClients.size === 0) return;
    generate.mutate(
      { campaign_id: campaignId, client_ids: Array.from(selectedClients), channel, expires_in_days: expiresDays },
      { onSuccess: () => { setOpen(false); setSelectedClients(new Set()); } },
    );
  };

  const toggleAllClientsVisible = (checked: boolean) => {
    const s = new Set(selectedClients);
    (clients as any[]).forEach((c) => { if (checked) s.add(c.id); else s.delete(c.id); });
    setSelectedClients(s);
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

  const sendInvites = useMutation({
    mutationFn: async (invite_ids?: string[]) => {
      const { data, error } = await supabase.functions.invoke('nps-send-invite', { body: invite_ids ? { invite_ids } : {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ['nps'] });
      const sent = d?.sent ?? 0;
      const failed = d?.failed ?? 0;
      const results: any[] = Array.isArray(d?.results) ? d.results : [];
      const items: BulkResultItem[] = results.map((r) => ({
        id: r.id,
        name: inviteNameById(r.id),
        ok: !!r.ok,
        error: r.error,
      }));
      if (failed === 0) toast.success(`Enviados: ${sent}`);
      else toast.error(`Enviados: ${sent} · Falhas: ${failed}`);
      if (items.length > 0 && (failed > 0 || items.length > 1)) {
        setBulkResult({ title: 'Resultado do envio', items });
      }
      setSelectedInvites(new Set());
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao enviar'),
  });

  const resend = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nps_invites').update({ status: 'pending' }).eq('id', id);
      if (error) throw error;
      const { data, error: err2 } = await supabase.functions.invoke('nps-send-invite', { body: { invite_ids: [id] } });
      if (err2) throw err2;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Convite reenviado'); },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao reenviar'),
  });

  const togglePageSelection = (checked: boolean) => {
    const s = new Set(selectedInvites);
    pageInvites.forEach((i: any) => { if (checked) s.add(i.id); else s.delete(i.id); });
    setSelectedInvites(s);
  };

  const copyAllLinks = async () => {
    const ids = Array.from(selectedInvites);
    if (ids.length === 0) return;
    const { data: tokens, error } = await supabase.from('nps_tokens').select('invite_id,token').in('invite_id', ids);
    if (error) { toast.error('Erro ao buscar tokens'); return; }
    const map = new Map<string, string>();
    (tokens ?? []).forEach((t: any) => { if (t.invite_id) map.set(t.invite_id, t.token); });
    const items: BulkResultItem[] = ids.map((id) => {
      const tk = map.get(id);
      return tk
        ? { id, name: inviteNameById(id), ok: true }
        : { id, name: inviteNameById(id), ok: false, error: 'Token indisponível' };
    });
    const links = items.filter((r) => r.ok).map((r) => publicSurveyUrl(map.get(r.id)!)).join('\n');
    const okCount = items.filter((r) => r.ok).length;
    const failCount = items.length - okCount;
    if (!links) {
      toast.error('Nenhum link disponível');
      setBulkResult({ title: 'Copiar links', items });
      return;
    }
    try {
      await navigator.clipboard.writeText(links);
      if (failCount === 0) toast.success(`${okCount} link(s) copiado(s)`);
      else { toast.error(`${okCount} copiado(s) · ${failCount} sem link`); setBulkResult({ title: 'Copiar links', items }); }
    } catch {
      toast.error('Não foi possível copiar para a área de transferência');
    }
  };

  const confirmSendBulk = async () => {
    if (selectedSendable.length === 0) return;
    const ok = await confirm({
      title: `Enviar ${selectedSendable.length} convite(s) por e-mail?`,
      description: 'Os convites elegíveis (pendentes ou com falha, canal e-mail) serão disparados agora.',
      confirmLabel: 'Enviar',
    });
    if (ok) sendInvites.mutate(selectedSendable);
  };

  const confirmRevokeBulk = async () => {
    const ids = Array.from(selectedInvites);
    if (ids.length === 0) return;
    const ok = await confirm({
      title: `Revogar ${ids.length} convite(s)?`,
      description: 'Links revogados deixam de aceitar respostas. Esta ação não pode ser desfeita.',
      confirmLabel: 'Revogar',
      variant: 'destructive',
    });
    if (ok) revoke.mutate(ids);
  };

  const confirmRevokeOne = async (id: string) => {
    const ok = await confirm({
      title: 'Revogar convite?',
      description: `O link enviado para ${inviteNameById(id)} deixará de funcionar.`,
      confirmLabel: 'Revogar',
      variant: 'destructive',
    });
    if (ok) revoke.mutate([id]);
  };


  const exportCsv = () => {
    if (filteredInvites.length === 0) { toast.error('Sem dados para exportar'); return; }
    const rows = filteredInvites.map((i: any) => ({
      cliente: i.clients?.name ?? '',
      email: i.clients?.email ?? '',
      telefone: i.clients?.phone ?? '',
      campanha: i.nps_campaigns?.name ?? '',
      canal: i.channel,
      status: i.status,
      tentativas: i.attempts ?? 0,
      criado_em: i.created_at ? new Date(i.created_at).toLocaleString('pt-BR') : '',
      enviado_em: i.sent_at ? new Date(i.sent_at).toLocaleString('pt-BR') : '',
      aberto_em: i.opened_at ? new Date(i.opened_at).toLocaleString('pt-BR') : '',
      respondido_em: i.responded_at ? new Date(i.responded_at).toLocaleString('pt-BR') : '',
    }));
    exportToCSV(rows as any, [
      { key: 'cliente', label: 'Cliente' },
      { key: 'email', label: 'E-mail' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'campanha', label: 'Campanha' },
      { key: 'canal', label: 'Canal' },
      { key: 'status', label: 'Status' },
      { key: 'tentativas', label: 'Tentativas' },
      { key: 'criado_em', label: 'Criado em' },
      { key: 'enviado_em', label: 'Enviado em' },
      { key: 'aberto_em', label: 'Aberto em' },
      { key: 'respondido_em', label: 'Respondido em' },
    ], `nps_convites_${new Date().toISOString().split('T')[0]}`);
    toast.success('Exportado com sucesso');
  };

  const allPageChecked = pageInvites.length > 0 && pageInvites.every((i: any) => selectedInvites.has(i.id));
  const selectedSendable = Array.from(selectedInvites).filter((id) => {
    const inv = filteredInvites.find((i: any) => i.id === id);
    return inv && ['pending', 'failed', 'bounced'].includes(inv.status) && inv.channel === 'email';
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold">Convites</h2>
          <p className="text-sm text-muted-foreground">Envie a pesquisa por link, e-mail, WhatsApp, SMS ou QR Code.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> Exportar CSV</Button>
          <Button variant="outline" size="sm" onClick={async () => {
            const ok = await confirm({ title: 'Enviar todos os convites pendentes?', description: 'Serão disparados até 50 convites por vez.', confirmLabel: 'Enviar' });
            if (ok) sendInvites.mutate(undefined);
          }} disabled={sendInvites.isPending}>
            <Mail className="mr-2 h-4 w-4" /> Enviar pendentes
          </Button>
          <Button size="sm" onClick={() => setOpen(true)} disabled={!campaignId}><Send className="mr-2 h-4 w-4" /> Gerar convites</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <KPI label="Total" value={stats.total} />
        <KPI label="Enviados" value={stats.sent} tone="default" />
        <KPI label="Abertos" value={stats.opened} sub={`${stats.openRate}%`} tone="info" />
        <KPI label="Respondidos" value={stats.responded} sub={`${stats.responseRate}%`} tone="success" />
        <KPI label="Pendentes" value={stats.pending} tone="warn" />
        <KPI label="Falhas" value={stats.bounced} tone="danger" />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <Label>Campanha</Label>
          <Select value={campaignId} onValueChange={(v) => { setCampaignId(v); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{campaigns.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
              <SelectItem value="opened">Aberto</SelectItem>
              <SelectItem value="responded">Respondido</SelectItem>
              <SelectItem value="bounced">Falha</SelectItem>
              <SelectItem value="revoked">Revogado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Canal</Label>
          <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v); setPage(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {CHANNELS.map((c) => <SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={textFilter} onChange={(e) => { setTextFilter(e.target.value); setPage(1); }} placeholder="Cliente, e-mail ou telefone" className="pl-8" />
          </div>
        </div>
      </div>

      {/* Bulk toolbar */}
      {selectedInvites.size > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span>{selectedInvites.size} selecionado(s)</span>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={copyAllLinks}><Copy className="mr-2 h-3.5 w-3.5" /> Copiar links</Button>
            <Button size="sm" variant="outline" onClick={confirmSendBulk} disabled={selectedSendable.length === 0 || sendInvites.isPending}>
              <Mail className="mr-2 h-3.5 w-3.5" /> Enviar por e-mail ({selectedSendable.length})
            </Button>
            <Button size="sm" variant="outline" onClick={confirmRevokeBulk} disabled={revoke.isPending}>
              <Trash2 className="mr-2 h-3.5 w-3.5 text-red-500" /> Revogar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedInvites(new Set())}>Limpar</Button>
          </div>
        </div>
      )}

      {isLoading ? <Skeleton className="h-64" /> : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 w-10"><Checkbox checked={allPageChecked} onCheckedChange={(v) => togglePageSelection(!!v)} /></th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Canal</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Tent.</th>
                  <th className="text-left p-3">Enviado</th>
                  <th className="text-left p-3">Aberto</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageInvites.map((i: any) => {
                  const tk = tokensByInvite.get(i.id);
                  const checked = selectedInvites.has(i.id);
                  return (
                    <tr key={i.id} className="border-t border-border hover:bg-muted/20">
                      <td className="p-3">
                        <Checkbox checked={checked} onCheckedChange={(v) => {
                          const s = new Set(selectedInvites);
                          v ? s.add(i.id) : s.delete(i.id);
                          setSelectedInvites(s);
                        }} />
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{i.clients?.name ?? '—'}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[240px]">{i.clients?.email ?? i.clients?.phone ?? ''}</div>
                      </td>
                      <td className="p-3"><Badge variant="outline">{i.channel}</Badge></td>
                      <td className="p-3"><StatusBadge status={i.status} /></td>
                      <td className="p-3 text-xs">{i.attempts ?? 0}</td>
                      <td className="p-3 text-xs text-muted-foreground">{i.sent_at ? new Date(i.sent_at).toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="p-3 text-xs text-muted-foreground">{i.opened_at ? new Date(i.opened_at).toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {tk && (
                            <>
                              <Button size="sm" variant="ghost" title="Abrir pesquisa" onClick={() => window.open(publicSurveyUrl(tk), '_blank')}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
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
                          {i.status !== 'responded' && i.status !== 'revoked' && i.channel === 'email' && (
                            <Button size="sm" variant="ghost" title="Reenviar" onClick={() => resend.mutate(i.id)} disabled={resend.isPending}>
                              <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                          )}
                          {i.status !== 'responded' && i.status !== 'revoked' && (
                            <Button size="sm" variant="ghost" title="Revogar" onClick={() => confirmRevokeOne(i.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {pageInvites.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">
                    {campaignId ? 'Nenhum convite com esses filtros.' : 'Selecione uma campanha para começar.'}
                  </td></tr>
                )}
              </tbody>
            </table>

            {filteredInvites.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs text-muted-foreground">
                <span>Página {currentPage} de {totalPages} · {filteredInvites.length} registros</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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
                  checked={clients.every((c: any) => selectedClients.has(c.id))}
                  onCheckedChange={(v) => toggleAllClientsVisible(!!v)}
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
                      checked={selectedClients.has(c.id)}
                      onCheckedChange={(v) => { const s = new Set(selectedClients); v ? s.add(c.id) : s.delete(c.id); setSelectedClients(s); }}
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
              {selectedClients.size} selecionado(s). Após gerar, você poderá copiar o link ou disparar pelo WhatsApp/e-mail direto da lista.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={selectedClients.size === 0 || generate.isPending}>
              {generate.isPending ? <RotateCcw className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Gerar {selectedClients.size} convite(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QRCodeDialog open={!!qrUrl} onOpenChange={(v) => !v && setQrUrl(null)} url={qrUrl ?? ''} />

      <Dialog open={!!bulkResult} onOpenChange={(v) => !v && setBulkResult(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{bulkResult?.title ?? 'Resultado'}</DialogTitle>
          </DialogHeader>
          {bulkResult && (() => {
            const ok = bulkResult.items.filter((r) => r.ok).length;
            const fail = bulkResult.items.length - ok;
            return (
              <div className="space-y-3">
                <div className="flex gap-2 text-sm">
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30" variant="outline">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {ok} sucesso(s)
                  </Badge>
                  {fail > 0 && (
                    <Badge className="text-red-500 border-red-500/40" variant="outline">
                      <XCircle className="h-3.5 w-3.5 mr-1" /> {fail} falha(s)
                    </Badge>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto border rounded divide-y divide-border">
                  {bulkResult.items.map((r) => (
                    <div key={r.id} className="flex items-start gap-2 p-2 text-sm">
                      {r.ok
                        ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        : <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{r.name}</div>
                        {!r.ok && r.error && (
                          <div className="text-xs text-red-500 truncate" title={r.error}>{r.error}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => {
              if (!bulkResult) return;
              const txt = bulkResult.items.map((r) => `${r.ok ? 'OK' : 'FALHA'}\t${r.name}${r.error ? `\t${r.error}` : ''}`).join('\n');
              navigator.clipboard.writeText(txt);
              toast.success('Resultado copiado');
            }}><Copy className="h-3.5 w-3.5 mr-2" /> Copiar</Button>
            <Button onClick={() => setBulkResult(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KPI({ label, value, sub, tone = 'default' }: { label: string; value: number | string; sub?: string; tone?: 'default' | 'success' | 'warn' | 'danger' | 'info' }) {
  const toneClass = {
    default: 'text-foreground',
    success: 'text-green-500',
    warn: 'text-amber-500',
    danger: 'text-red-500',
    info: 'text-blue-500',
  }[tone];
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: any; className?: string }> = {
    pending: { label: 'Pendente', variant: 'secondary' },
    sent: { label: 'Enviado', variant: 'default' },
    opened: { label: 'Aberto', variant: 'default', className: 'bg-blue-500/20 text-blue-500 border-blue-500/30' },
    responded: { label: 'Respondido', variant: 'default', className: 'bg-green-500/20 text-green-500 border-green-500/30' },
    bounced: { label: 'Falha', variant: 'outline', className: 'text-red-500 border-red-500/40' },
    failed: { label: 'Falha', variant: 'outline', className: 'text-red-500 border-red-500/40' },
    revoked: { label: 'Revogado', variant: 'outline' },
  };
  const s = map[status] ?? { label: status, variant: 'outline' };
  return <Badge variant={s.variant} className={s.className}>{s.label}</Badge>;
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
