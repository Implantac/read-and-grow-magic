import { useState } from 'react';
import { useNPSAutomations, useSaveAutomation, useNPSCampaigns } from './hooks';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Switch } from '@/ui/base/switch';
import { Skeleton } from '@/ui/base/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Plus, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';

const TRIGGERS = [
  ['order_created', 'Após venda'],
  ['order_billed', 'Após faturamento'],
  ['invoice_issued', 'Após emissão da NF'],
  ['delivered', 'Após entrega'],
  ['service_closed', 'Após atendimento'],
  ['os_closed', 'Após OS encerrada'],
  ['contract_closed', 'Após contrato encerrado'],
  ['payment_received', 'Após pagamento'],
  ['after_days', 'Após X dias'],
  ['after_hours', 'Após X horas'],
  ['last_purchase', 'Após última compra'],
] as const;

export default function Automations() {
  const { data: automations = [], isLoading } = useNPSAutomations();
  const { data: campaigns = [] } = useNPSCampaigns();
  const save = useSaveAutomation();
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('nps_automations').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Removida'); },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ name: '', trigger: 'order_billed', delay_value: 0, delay_unit: 'hours', channel: 'email', active: true, campaign_id: null });

  const submit = () => save.mutate(form, { onSuccess: () => setOpen(false) });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Automações</h2>
          <p className="text-sm text-muted-foreground">Envie a pesquisa automaticamente conforme eventos do ERP.</p>
        </div>
        <Button onClick={() => { setForm({ name: '', trigger: 'order_billed', delay_value: 24, delay_unit: 'hours', channel: 'email', active: true, campaign_id: null }); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova automação
        </Button>
      </div>

      {isLoading ? <Skeleton className="h-40" /> : (
        <div className="space-y-2">
          {automations.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="pt-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {TRIGGERS.find(t => t[0] === a.trigger)?.[1] ?? a.trigger} · {a.delay_value} {a.delay_unit} · {a.channel} · {a.nps_campaigns?.name ?? 'sem campanha'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={a.active} onCheckedChange={(v) => save.mutate({ id: a.id, active: v })} />
                  <Button size="icon" variant="ghost" onClick={() => { setForm(a); setOpen(true); }}>Editar</Button>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(a.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {automations.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma automação. Crie a primeira.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Automação</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="col-span-2"><Label>Campanha</Label>
              <Select value={form.campaign_id ?? ''} onValueChange={(v) => setForm({ ...form, campaign_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>{campaigns.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Gatilho</Label>
              <Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TRIGGERS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Canal</Label>
              <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Atraso</Label><Input type="number" value={form.delay_value} onChange={(e) => setForm({ ...form, delay_value: Number(e.target.value) })} /></div>
            <div><Label>Unidade</Label>
              <Select value={form.delay_unit} onValueChange={(v) => setForm({ ...form, delay_unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                  <SelectItem value="days">Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!form.name || !form.campaign_id}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
