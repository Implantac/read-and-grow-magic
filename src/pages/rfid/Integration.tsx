import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Switch } from '@/ui/base/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/base/dialog';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import {
  ArrowRightLeft, Plus, RefreshCw, CheckCircle2, PackagePlus,
  PackageSearch, Zap, Settings2, Activity, Layers, Pencil, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRFIDEvents } from '@/hooks/system/useRFID';

// ─── Types ─────────────────────────────────────────────────────────────────
interface WMSRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  triggerZone?: string;
  triggerEventType: string;
  triggerReaderCode?: string;
  wmsAction: string;
  wmsTargetLocation?: string;
  autoComplete: boolean;
  priority: number;
  createdAt: string;
}

const EVENT_TYPE_OPTIONS = [
  { value: 'read', label: 'Leitura' },
  { value: 'entry', label: 'Entrada' },
  { value: 'exit', label: 'Saída' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'inventory', label: 'Inventário' },
];

const WMS_ACTION_OPTIONS = [
  { value: 'receive', label: 'Recebimento WMS', icon: PackagePlus },
  { value: 'pick', label: 'Picking WMS', icon: PackageSearch },
  { value: 'transfer', label: 'Transferência automática', icon: ArrowRightLeft },
  { value: 'inventory_count', label: 'Contagem de inventário', icon: Layers },
];

const actionConfig: Record<string, { label: string; color: string }> = {
  receive: { label: 'Recebimento', color: 'text-blue-500' },
  pick: { label: 'Picking', color: 'text-amber-500' },
  transfer: { label: 'Transferência', color: 'text-purple-500' },
  inventory_count: { label: 'Inventário', color: 'text-green-500' },
};

const emptyRule = {
  name: '',
  description: '',
  enabled: true,
  triggerZone: '',
  triggerEventType: 'entry',
  triggerReaderCode: '',
  wmsAction: 'receive',
  wmsTargetLocation: '',
  autoComplete: false,
  priority: 5,
};

// ─── Hook ──────────────────────────────────────────────────────────────────
function useRFIDWMSRules() {
  const [rules, setRules] = useState<WMSRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('rfid_wms_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (error) { console.error(error); toast.error('Erro ao carregar regras'); }
    else setRules((data || []).map((r: any) => ({
      id: r.id, name: r.name, description: r.description, enabled: r.enabled,
      triggerZone: r.trigger_zone, triggerEventType: r.trigger_event_type,
      triggerReaderCode: r.trigger_reader_code, wmsAction: r.wms_action,
      wmsTargetLocation: r.wms_target_location, autoComplete: r.auto_complete,
      priority: r.priority, createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  const create = async (rule: typeof emptyRule) => {
    const { error } = await (supabase as any).from('rfid_wms_rules').insert({
      name: rule.name, description: rule.description || null, enabled: rule.enabled,
      trigger_zone: rule.triggerZone || null, trigger_event_type: rule.triggerEventType,
      trigger_reader_code: rule.triggerReaderCode || null, wms_action: rule.wmsAction,
      wms_target_location: rule.wmsTargetLocation || null,
      auto_complete: rule.autoComplete, priority: rule.priority,
    });
    if (error) { toast.error('Erro ao criar regra'); return false; }
    toast.success('Regra criada!');
    await fetch();
    return true;
  };

  const update = async (id: string, updates: Partial<WMSRule>) => {
    const { error } = await (supabase as any).from('rfid_wms_rules').update({
      name: updates.name, description: updates.description,
      enabled: updates.enabled, trigger_zone: updates.triggerZone || null,
      trigger_event_type: updates.triggerEventType, trigger_reader_code: updates.triggerReaderCode || null,
      wms_action: updates.wmsAction, wms_target_location: updates.wmsTargetLocation || null,
      auto_complete: updates.autoComplete, priority: updates.priority,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar regra'); return false; }
    toast.success('Regra atualizada!');
    await fetch();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from('rfid_wms_rules').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir regra'); return false; }
    toast.success('Regra excluída!');
    await fetch();
    return true;
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    const { error } = await (supabase as any).from('rfid_wms_rules').update({ enabled }).eq('id', id);
    if (error) { toast.error('Erro ao alterar status'); return; }
    await fetch();
  };

  useEffect(() => { fetch(); }, [fetch]);
  return { rules, loading, refetch: fetch, create, update, remove, toggleEnabled };
}

// ─── Rule Form Dialog ──────────────────────────────────────────────────────
function RuleDialog({
  open, onClose, onSave, initial
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: typeof emptyRule) => Promise<boolean>;
  initial?: typeof emptyRule;
}) {
  const [form, setForm] = useState(initial ?? emptyRule);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initial ?? emptyRule); }, [initial, open]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    const ok = await onSave(form);
    setSaving(false);
    if (ok) onClose();
  };

  const set = (k: keyof typeof emptyRule, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Regra' : 'Nova Regra de Integração'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Auto-receber na doca" />
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Opcional" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo de Evento RFID *</Label>
              <Select value={form.triggerEventType} onValueChange={v => set('triggerEventType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Ação WMS *</Label>
              <Select value={form.wmsAction} onValueChange={v => set('wmsAction', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WMS_ACTION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Zona RFID (opcional)</Label>
              <Input value={form.triggerZone} onChange={e => set('triggerZone', e.target.value)} placeholder="Recebimento, Picking..." />
            </div>
            <div className="grid gap-2">
              <Label>Código do Leitor (opcional)</Label>
              <Input value={form.triggerReaderCode} onChange={e => set('triggerReaderCode', e.target.value)} placeholder="READER-001" />
            </div>
          </div>
          {form.wmsAction === 'transfer' && (
            <div className="grid gap-2">
              <Label>Local de Destino (Transferência)</Label>
              <Input value={form.wmsTargetLocation} onChange={e => set('wmsTargetLocation', e.target.value)} placeholder="Ex: A-01-02" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Prioridade</Label>
              <Input type="number" min={1} max={100} value={form.priority}
                onChange={e => set('priority', parseInt(e.target.value) || 1)} />
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Label>Auto-concluir operação WMS</Label>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={form.autoComplete} onCheckedChange={v => set('autoComplete', v)} />
                <span className="text-sm text-muted-foreground">{form.autoComplete ? 'Sim' : 'Não'}</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function RFIDIntegrationPage() {
  const { rules, loading, refetch, create, update, remove, toggleEnabled } = useRFIDWMSRules();
  const { events } = useRFIDEvents(50);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WMSRule | null>(null);

  // Processed events (those triggered WMS actions)
  const processedEvents = events.filter(e => e.processed && e.actionTaken);

  const activeRules = rules.filter(r => r.enabled).length;
  const totalRules = rules.length;

  const openNew = () => { setEditTarget(null); setDialogOpen(true); };
  const openEdit = (rule: WMSRule) => {
    setEditTarget(rule);
    setDialogOpen(true);
  };

  const handleSave = async (data: typeof emptyRule) => {
    if (editTarget) {
      return update(editTarget.id, {
        name: data.name, description: data.description, enabled: data.enabled,
        triggerZone: data.triggerZone, triggerEventType: data.triggerEventType,
        triggerReaderCode: data.triggerReaderCode, wmsAction: data.wmsAction,
        wmsTargetLocation: data.wmsTargetLocation, autoComplete: data.autoComplete,
        priority: data.priority,
      });
    }
    return create(data);
  };

  const getInitialForEdit = (rule: WMSRule): typeof emptyRule => ({
    name: rule.name, description: rule.description ?? '',
    enabled: rule.enabled, triggerZone: rule.triggerZone ?? '',
    triggerEventType: rule.triggerEventType, triggerReaderCode: rule.triggerReaderCode ?? '',
    wmsAction: rule.wmsAction, wmsTargetLocation: rule.wmsTargetLocation ?? '',
    autoComplete: rule.autoComplete, priority: rule.priority,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            Integração RFID ↔ WMS
          </h1>
          <p className="text-muted-foreground">Regras de automação: eventos RFID acionando operações WMS em tempo real</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch}><RefreshCw className="h-4 w-4 mr-1" />Atualizar</Button>
          <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Nova Regra</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10"><Zap className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{activeRules}</p><p className="text-xs text-muted-foreground">Regras Ativas</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-muted"><Settings2 className="h-5 w-5 text-muted-foreground" /></div>
            <div><p className="text-2xl font-bold">{totalRules}</p><p className="text-xs text-muted-foreground">Total de Regras</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
            <div><p className="text-2xl font-bold">{processedEvents.length}</p><p className="text-xs text-muted-foreground">Eventos Processados</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-500/10"><Activity className="h-5 w-5 text-amber-500" /></div>
            <div><p className="text-2xl font-bold">{events.filter(e => !e.processed).length}</p><p className="text-xs text-muted-foreground">Aguardando</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Regras de Automação</TabsTrigger>
          <TabsTrigger value="log">Log de Ações WMS</TabsTrigger>
          <TabsTrigger value="howto">Como Funciona</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" />Regras de Integração</CardTitle>
              <CardDescription>Defina o que acontece no WMS quando um leitor RFID detectar uma tag</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Ativo</TableHead>
                      <TableHead>Nome / Descrição</TableHead>
                      <TableHead>Gatilho RFID</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead>Ação WMS</TableHead>
                      <TableHead className="text-center">Prioridade</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map(rule => {
                      const cfg = actionConfig[rule.wmsAction] ?? { label: rule.wmsAction, color: 'text-foreground' };
                      const evtLabel = EVENT_TYPE_OPTIONS.find(e => e.value === rule.triggerEventType)?.label ?? rule.triggerEventType;
                      return (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <Switch
                              checked={rule.enabled}
                              onCheckedChange={v => toggleEnabled(rule.id, v)}
                            />
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">{rule.name}</p>
                            {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{evtLabel}</Badge>
                            {rule.triggerReaderCode && (
                              <p className="text-xs text-muted-foreground mt-1">Leitor: {rule.triggerReaderCode}</p>
                            )}
                          </TableCell>
                          <TableCell>{rule.triggerZone ?? <span className="text-muted-foreground text-xs">Qualquer</span>}</TableCell>
                          <TableCell>
                            <span className={`font-medium text-sm ${cfg.color}`}>{cfg.label}</span>
                            {rule.wmsTargetLocation && (
                              <p className="text-xs text-muted-foreground">→ {rule.wmsTargetLocation}</p>
                            )}
                            {rule.autoComplete && (
                              <Badge variant="secondary" className="text-xs mt-1">Auto-concluir</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{rule.priority}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => remove(rule.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {rules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          Nenhuma regra configurada. Clique em "Nova Regra" para começar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Log Tab */}
        <TabsContent value="log" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Ações WMS Geradas por RFID
                <Badge variant="outline" className="animate-pulse text-xs">TEMPO REAL</Badge>
              </CardTitle>
              <CardDescription>Eventos RFID que acionaram automações no WMS</CardDescription>
            </CardHeader>
            <CardContent>
              {processedEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">
                  Nenhuma ação WMS gerada por RFID ainda. Configure regras ativas e envie eventos via webhook.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tag EPC</TableHead>
                      <TableHead>Leitor</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead>Ação WMS Executada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedEvents.map(ev => (
                      <TableRow key={ev.id}>
                        <TableCell className="text-xs">
                          {format(new Date(ev.createdAt), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{ev.tagEpc}</TableCell>
                        <TableCell className="text-xs">{ev.readerCode}</TableCell>
                        <TableCell>{ev.zone ?? ev.location ?? '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            <span className="text-sm">{ev.actionTaken}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* How-to Tab */}
        <TabsContent value="howto" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fluxo de Integração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                {[
                  { step: '1', icon: '📡', title: 'Leitor RFID detecta tag', desc: 'O leitor físico captura o EPC da tag e envia via HTTP POST para o webhook.' },
                  { step: '2', icon: '🔗', title: 'Webhook recebe o evento', desc: 'O backend registra o evento na tabela rfid_events com leitor, zona e tipo.' },
                  { step: '3', icon: '⚡', title: 'Trigger avalia regras', desc: 'O banco avalia automaticamente as regras ativas e encontra a de maior prioridade.' },
                  { step: '4', icon: '🏭', title: 'Ação WMS é executada', desc: 'O recebimento é atualizado, o picking marcado, ou uma transferência criada automaticamente.' },
                ].map(s => (
                  <div key={s.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">{s.step}</div>
                    <div>
                      <p className="font-medium text-foreground">{s.icon} {s.title}</p>
                      <p>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Exemplo de Payload (Webhook)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto text-foreground">
{`POST /functions/v1/rfid-webhook

{
  "reader_code": "READER-DOCK-01",
  "tag_epc": "E200001234567890",
  "event_type": "entry",
  "zone": "Recebimento",
  "rssi": -45,
  "antenna": 1
}`}
                </pre>
                <div className="mt-4 p-3 rounded-md bg-green-500/10 text-sm text-green-700 dark:text-green-300">
                  <strong>Resultado automático:</strong> Se existir uma regra com zona "Recebimento" e evento "entry" acionando "receive", a ordem de recebimento WMS mais recente será atualizada automaticamente.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <RuleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initial={editTarget ? getInitialForEdit(editTarget) : undefined}
      />
    </div>
  );
}
