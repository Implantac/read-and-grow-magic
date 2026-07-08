import { useState } from 'react';
import { useNPSWebhooks, useSaveWebhook } from './hooks';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Switch } from '@/ui/base/switch';
import { Skeleton } from '@/ui/base/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { Plus, Trash2, Webhook, Shield } from 'lucide-react';
import { toast } from 'sonner';

const EVENTS = ['survey.created', 'invite.sent', 'survey.opened', 'survey.completed', 'customer.promoter', 'customer.passive', 'customer.detractor'];

export default function Settings() {
  const { data: webhooks = [], isLoading } = useNPSWebhooks();
  const saveWH = useSaveWebhook();
  const qc = useQueryClient();
  const { activeCompanyId } = useEnterprise() as any;
  const delWH = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('nps_webhooks').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Removido'); },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ name: '', url: '', secret: '', events: [], active: true });

  const { data: alerts = [] } = useQuery({
    queryKey: ['nps-alerts-config', activeCompanyId],
    enabled: !!activeCompanyId,
    queryFn: async () => {
      const { data } = await supabase.from('nps_alerts_config').select('*').eq('company_id', activeCompanyId);
      return data ?? [];
    },
  });

  const saveAlert = useMutation({
    mutationFn: async (input: any) => {
      if (input.id) {
        const { error } = await supabase.from('nps_alerts_config').update(input).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nps_alerts_config').insert({ ...input, company_id: activeCompanyId });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps-alerts-config'] }); toast.success('Alerta salvo'); },
  });

  const [alertForm, setAlertForm] = useState({ name: 'Detrator crítico', score_max: 6, channels: ['system','email'] });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Configurações</h2>
        <p className="text-sm text-muted-foreground">Webhooks, alertas e segurança do módulo.</p>
      </div>

      {/* Webhooks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Webhook className="h-4 w-4" /> Webhooks</CardTitle>
          <Button size="sm" onClick={() => { setForm({ name: '', url: '', secret: '', events: [], active: true }); setOpen(true); }}><Plus className="h-3 w-3 mr-1" /> Novo</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? <Skeleton className="h-20" /> : webhooks.map((w: any) => (
            <div key={w.id} className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <div className="font-medium">{w.name}</div>
                <div className="text-xs text-muted-foreground">{w.url} · {(w.events ?? []).length} evento(s)</div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={w.active} onCheckedChange={(v) => saveWH.mutate({ id: w.id, active: v })} />
                <Button size="icon" variant="ghost" onClick={() => delWH.mutate(w.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </div>
            </div>
          ))}
          {webhooks.length === 0 && !isLoading && <p className="text-sm text-muted-foreground">Nenhum webhook.</p>}
        </CardContent>
      </Card>

      {/* Alertas */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Alertas críticos</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
            <div><Label>Nome</Label><Input value={alertForm.name} onChange={(e) => setAlertForm({ ...alertForm, name: e.target.value })} /></div>
            <div><Label>Nota máxima</Label><Input type="number" value={alertForm.score_max} onChange={(e) => setAlertForm({ ...alertForm, score_max: Number(e.target.value) })} /></div>
            <div className="md:col-span-2 flex justify-end"><Button onClick={() => saveAlert.mutate(alertForm)}>Adicionar</Button></div>
          </div>
          {alerts.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between border-b border-border pb-2 text-sm">
              <div>{a.name} — notifica quando nota ≤ {a.score_max}</div>
              <Switch checked={a.active} onCheckedChange={(v) => saveAlert.mutate({ id: a.id, active: v })} />
            </div>
          ))}
          {alerts.length === 0 && <p className="text-sm text-muted-foreground">Sem regras de alerta.</p>}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Webhook</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Segredo (opcional)</Label><Input value={form.secret ?? ''} onChange={(e) => setForm({ ...form, secret: e.target.value })} /></div>
            <div>
              <Label>Eventos</Label>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {EVENTS.map(ev => (
                  <label key={ev} className="text-xs flex items-center gap-1">
                    <input type="checkbox" checked={form.events?.includes(ev)} onChange={(e) => setForm({ ...form, events: e.target.checked ? [...(form.events ?? []), ev] : (form.events ?? []).filter((x: string) => x !== ev) })} />
                    {ev}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveWH.mutate(form, { onSuccess: () => setOpen(false) })} disabled={!form.name || !form.url}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
