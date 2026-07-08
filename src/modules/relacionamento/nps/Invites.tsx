import { useMemo, useState } from 'react';
import { useNPSCampaigns, useNPSInvites, useGenerateInvites, publicSurveyUrl } from './hooks';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Skeleton } from '@/ui/base/skeleton';
import { Badge } from '@/ui/base/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Send, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function Invites() {
  const { data: campaigns = [] } = useNPSCampaigns();
  const [campaignId, setCampaignId] = useState<string | undefined>();
  const { data: invites = [], isLoading } = useNPSInvites(campaignId);
  const generate = useGenerateInvites();
  const { currentCompany } = useEnterprise() as any; const activeCompanyId = currentCompany?.id;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState('link');

  const { data: clients = [] } = useQuery({
    queryKey: ['nps', 'clients-picker', activeCompanyId, search],
    enabled: !!activeCompanyId && open,
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('id,name,email,phone,city').eq('company_id', activeCompanyId).ilike('name', `%${search}%`).limit(50);
      return data ?? [];
    },
  });

  const tokensByInvite = useTokensMap(invites);

  const submit = () => {
    if (!campaignId || selected.size === 0) return;
    generate.mutate({ campaign_id: campaignId, client_ids: Array.from(selected), channel, expires_in_days: 30 }, {
      onSuccess: () => { setOpen(false); setSelected(new Set()); },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Convites</h2>
          <p className="text-sm text-muted-foreground">Gerencie envios e status por canal.</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={!campaignId}><Send className="mr-2 h-4 w-4" /> Gerar convites</Button>
      </div>

      <div className="max-w-md">
        <Label>Campanha</Label>
        <Select value={campaignId} onValueChange={setCampaignId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{campaigns.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {isLoading ? <Skeleton className="h-64" /> : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Campanha</th>
                  <th className="text-left p-3">Canal</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Link público</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((i: any) => {
                  const tk = tokensByInvite.get(i.id);
                  return (
                    <tr key={i.id} className="border-t border-border">
                      <td className="p-3">{i.clients?.name ?? '—'}</td>
                      <td className="p-3">{i.nps_campaigns?.name}</td>
                      <td className="p-3"><Badge variant="outline">{i.channel}</Badge></td>
                      <td className="p-3"><Badge>{i.status}</Badge></td>
                      <td className="p-3">
                        {tk && <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(publicSurveyUrl(tk)); toast.success('Link copiado'); }}><Copy className="h-3 w-3 mr-1" /> Copiar</Button>}
                      </td>
                    </tr>
                  );
                })}
                {invites.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sem convites</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Gerar convites</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Canal</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link manual</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="qr">QR Code</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Buscar cliente</Label><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome do cliente..." /></div>
            <div className="max-h-64 overflow-y-auto border rounded">
              {clients.map((c: any) => (
                <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer border-b border-border last:border-0">
                  <input type="checkbox" checked={selected.has(c.id)} onChange={(e) => { const s = new Set(selected); e.target.checked ? s.add(c.id) : s.delete(c.id); setSelected(s); }} />
                  <div className="flex-1"><div>{c.name}</div><div className="text-xs text-muted-foreground">{c.email ?? ''} · {c.address_city ?? ''}</div></div>
                </label>
              ))}
              {clients.length === 0 && <p className="p-4 text-sm text-muted-foreground">Sem clientes</p>}
            </div>
            <p className="text-xs text-muted-foreground">{selected.size} selecionado(s)</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={selected.size === 0 || generate.isPending}>Gerar {selected.size} convite(s)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
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
