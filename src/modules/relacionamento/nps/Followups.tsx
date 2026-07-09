import { useMemo, useState } from 'react';
import { useNPSFollowups, useUpdateFollowup } from './hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Textarea } from '@/ui/base/textarea';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/ui/base/dialog';
import { AlertTriangle, Clock, CheckCircle2, PhoneCall, Mail, MessageCircle } from 'lucide-react';

const STATUSES = [
  { v: 'open', label: 'Aberto', variant: 'destructive' },
  { v: 'in_progress', label: 'Em andamento', variant: 'default' },
  { v: 'contacted', label: 'Contatado', variant: 'secondary' },
  { v: 'resolved', label: 'Resolvido', variant: 'outline' },
  { v: 'lost', label: 'Cliente perdido', variant: 'outline' },
];

const PRIORITIES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-500 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  low: 'bg-muted text-muted-foreground',
};

export default function Followups() {
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const { data: followups = [], isLoading } = useNPSFollowups(statusFilter);
  const update = useUpdateFollowup();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const kpis = useMemo(() => {
    const rows = followups as any[];
    return {
      total: rows.length,
      critical: rows.filter(r => r.priority === 'critical').length,
      overdue: rows.filter(r => r.due_date && new Date(r.due_date) < new Date() && !['resolved', 'lost'].includes(r.status)).length,
      resolved: rows.filter(r => r.status === 'resolved').length,
    };
  }, [followups]);

  const openEdit = (f: any) => {
    setEditing(f);
    setForm({
      status: f.status,
      priority: f.priority,
      root_cause: f.root_cause ?? '',
      action_taken: f.action_taken ?? '',
      resolution_notes: f.resolution_notes ?? '',
      assigned_to: f.assigned_to ?? '',
      due_date: f.due_date ?? '',
    });
  };

  const save = () => {
    if (!editing) return;
    const patch: any = { ...form };
    if (form.status === 'contacted' && !editing.contacted_at) patch.contacted_at = new Date().toISOString();
    if ((form.status === 'resolved' || form.status === 'lost') && !editing.resolved_at) patch.resolved_at = new Date().toISOString();
    if (!patch.due_date) patch.due_date = null;
    if (!patch.assigned_to) patch.assigned_to = null;
    update.mutate({ id: editing.id, ...patch }, { onSuccess: () => setEditing(null) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" /> Follow-up de detratores
          </h2>
          <p className="text-sm text-muted-foreground">
            Todo detrator vira automaticamente uma tarefa de retenção com prazo de 2 dias. Aja rápido para reverter a insatisfação.
          </p>
        </div>
        <div className="w-56">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUSES.map(s => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard label="Total no filtro" value={kpis.total} icon={<Clock className="h-4 w-4" />} />
        <KpiCard label="Críticos (nota ≤3)" value={kpis.critical} icon={<AlertTriangle className="h-4 w-4 text-red-500" />} accent="text-red-500" />
        <KpiCard label="Atrasados" value={kpis.overdue} icon={<Clock className="h-4 w-4 text-orange-500" />} accent="text-orange-500" />
        <KpiCard label="Resolvidos" value={kpis.resolved} icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />} accent="text-emerald-500" />
      </div>

      {isLoading ? <Skeleton className="h-64" /> : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-center p-3">Nota</th>
                  <th className="text-left p-3">Prioridade</th>
                  <th className="text-left p-3">Comentário</th>
                  <th className="text-left p-3">Prazo</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(followups as any[]).map(f => {
                  const overdue = f.due_date && new Date(f.due_date) < new Date() && !['resolved', 'lost'].includes(f.status);
                  return (
                    <tr key={f.id} className="border-t border-border hover:bg-muted/20">
                      <td className="p-3">
                        <div className="font-medium">{f.clients?.name ?? 'Cliente'}</div>
                        <div className="text-xs text-muted-foreground">{f.clients?.email ?? f.clients?.phone ?? '—'}</div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className="bg-red-500/20 text-red-500 border-red-500/30">{f.score}</Badge>
                      </td>
                      <td className="p-3"><Badge className={PRIORITIES[f.priority] ?? ''}>{f.priority}</Badge></td>
                      <td className="p-3 text-xs max-w-xs truncate">{f.comment ?? '—'}</td>
                      <td className={`p-3 text-xs ${overdue ? 'text-red-500 font-medium' : ''}`}>
                        {f.due_date ? new Date(f.due_date).toLocaleDateString('pt-BR') : '—'}
                        {overdue && ' ⚠'}
                      </td>
                      <td className="p-3"><Badge variant={(STATUSES.find(s => s.v === f.status)?.variant as any) ?? 'outline'}>{STATUSES.find(s => s.v === f.status)?.label ?? f.status}</Badge></td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {f.clients?.phone && (
                            <Button size="sm" variant="ghost" title="WhatsApp" onClick={() => {
                              const phone = f.clients.phone.replace(/\D/g, '');
                              const msg = encodeURIComponent(`Olá ${f.clients.name}, vi seu feedback e gostaria de conversar para entender como podemos melhorar.`);
                              window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                            }}><MessageCircle className="h-3.5 w-3.5" /></Button>
                          )}
                          {f.clients?.email && (
                            <Button size="sm" variant="ghost" title="E-mail" onClick={() => window.open(`mailto:${f.clients.email}?subject=${encodeURIComponent('Sobre seu feedback')}`, '_self')}>
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {f.clients?.phone && (
                            <Button size="sm" variant="ghost" title="Ligar" onClick={() => window.open(`tel:${f.clients.phone.replace(/\D/g, '')}`)}>
                              <PhoneCall className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openEdit(f)}>Tratar</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(followups as any[]).length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sem follow-ups nesse filtro.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tratar follow-up · {editing?.clients?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="p-3 rounded bg-muted/30 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Nota {editing.score}</Badge>
                  <span className="text-muted-foreground text-xs">{new Date(editing.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="italic text-muted-foreground">"{editing.comment ?? 'Sem comentário'}"</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Crítica</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prazo</Label>
                  <Input type="date" value={form.due_date ?? ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div>
                  <Label>Responsável (user id)</Label>
                  <Input value={form.assigned_to ?? ''} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} placeholder="Opcional" />
                </div>
              </div>
              <div>
                <Label>Causa-raiz</Label>
                <Textarea rows={2} value={form.root_cause} onChange={(e) => setForm({ ...form, root_cause: e.target.value })} placeholder="Ex.: Atraso na entrega, produto defeituoso, atendimento ruim..." />
              </div>
              <div>
                <Label>Ação tomada</Label>
                <Textarea rows={2} value={form.action_taken} onChange={(e) => setForm({ ...form, action_taken: e.target.value })} placeholder="Ex.: Ligação, desconto oferecido, produto trocado..." />
              </div>
              <div>
                <Label>Notas de resolução</Label>
                <Textarea rows={2} value={form.resolution_notes} onChange={(e) => setForm({ ...form, resolution_notes: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={update.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-xs uppercase text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent><div className={`text-2xl font-bold ${accent ?? ''}`}>{value}</div></CardContent>
    </Card>
  );
}
