import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/base/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { KPICard } from '@/shared/components/KPICard';
import { CalendarClock, Truck, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';

type Appt = {
  id: string;
  dock_id: string | null;
  carrier_name: string | null;
  plate: string | null;
  operation_type: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  linked_order: string | null;
  notes: string | null;
};

type Dock = { id: string; name: string; type: string | null; status: string | null };

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Agendado',
  arrived: 'Chegou',
  in_progress: 'Em operação',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'outline',
  arrived: 'secondary',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
  no_show: 'destructive',
};

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DockScheduling() {
  const [loading, setLoading] = useState(true);
  const [appts, setAppts] = useState<Appt[]>([]);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [day, setDay] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    dock_id: '',
    carrier_name: '',
    plate: '',
    operation_type: 'inbound',
    scheduled_start: toLocalInput(new Date()),
    scheduled_end: toLocalInput(new Date(Date.now() + 60 * 60 * 1000)),
    linked_order: '',
    notes: '',
  });

  async function load() {
    setLoading(true);
    const start = new Date(`${day}T00:00:00`).toISOString();
    const end = new Date(`${day}T23:59:59`).toISOString();
    const [a, d] = await Promise.all([
      supabase
        .from('yard_appointments')
        .select('*')
        .gte('scheduled_start', start)
        .lte('scheduled_start', end)
        .order('scheduled_start'),
      supabase.from('wms_docks').select('id,name,type,status').order('name'),
    ]);
    if (a.error) toastError('Erro ao carregar agendamentos', a.error.message);
    if (d.error) toastError('Erro ao carregar docas', d.error.message);
    setAppts((a.data as Appt[]) || []);
    setDocks((d.data as Dock[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  const kpis = useMemo(() => {
    const total = appts.length;
    const inProg = appts.filter((x) => x.status === 'in_progress').length;
    const done = appts.filter((x) => x.status === 'completed').length;
    const issues = appts.filter((x) => x.status === 'no_show' || x.status === 'cancelled').length;
    return { total, inProg, done, issues };
  }, [appts]);

  async function createAppt() {
    if (!form.dock_id || !form.scheduled_start || !form.scheduled_end) {
      toastError('Preencha doca e janela de horário');
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { data: company } = await supabase.rpc('get_user_company_id', {
      _user_id: userData.user?.id as string,
    });
    const payload = {
      ...form,
      scheduled_start: new Date(form.scheduled_start).toISOString(),
      scheduled_end: new Date(form.scheduled_end).toISOString(),
      status: 'scheduled',
      company_id: company,
    };
    const { error } = await supabase.from('yard_appointments').insert(payload);
    if (error) {
      toastError('Erro ao criar agendamento', error.message);
      return;
    }
    toastSuccess('Agendamento criado');
    setOpen(false);
    load();
  }

  async function changeStatus(id: string, status: string) {
    const { error } = await supabase.from('yard_appointments').update({ status }).eq('id', id);
    if (error) {
      toastError('Erro ao atualizar', error.message);
      return;
    }
    toastSuccess('Status atualizado');
    load();
  }

  // group appointments per dock for timeline
  const byDock = useMemo(() => {
    const map = new Map<string, Appt[]>();
    docks.forEach((d) => map.set(d.id, []));
    appts.forEach((a) => {
      if (!a.dock_id) return;
      if (!map.has(a.dock_id)) map.set(a.dock_id, []);
      map.get(a.dock_id)!.push(a);
    });
    return map;
  }, [appts, docks]);

  const dayStartHour = 6;
  const dayEndHour = 22;
  const hours = Array.from({ length: dayEndHour - dayStartHour + 1 }, (_, i) => dayStartHour + i);

  function blockStyle(a: Appt) {
    const s = new Date(a.scheduled_start);
    const e = new Date(a.scheduled_end);
    const startMin = s.getHours() * 60 + s.getMinutes() - dayStartHour * 60;
    const dur = Math.max(15, (e.getTime() - s.getTime()) / 60000);
    const total = (dayEndHour - dayStartHour) * 60;
    return {
      left: `${(startMin / total) * 100}%`,
      width: `${(dur / total) * 100}%`,
    };
  }

  return (
    <PageContainer loading={loading}>
      <PageHeader
        title="Agendamento de Docas"
        description="Janelas de chegada/expedição por doca com timeline operacional"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> Novo Agendamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo agendamento de doca</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>Doca</Label>
                  <Select value={form.dock_id} onValueChange={(v) => setForm({ ...form, dock_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {docks.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Operação</Label>
                    <Select value={form.operation_type} onValueChange={(v) => setForm({ ...form, operation_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbound">Recebimento</SelectItem>
                        <SelectItem value="outbound">Expedição</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pedido / Referência</Label>
                    <Input value={form.linked_order} onChange={(e) => setForm({ ...form, linked_order: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Transportadora</Label>
                    <Input value={form.carrier_name} onChange={(e) => setForm({ ...form, carrier_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Placa</Label>
                    <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Início</Label>
                    <Input type="datetime-local" value={form.scheduled_start} onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })} />
                  </div>
                  <div>
                    <Label>Fim</Label>
                    <Input type="datetime-local" value={form.scheduled_end} onChange={(e) => setForm({ ...form, scheduled_end: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button onClick={createAppt}>Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Agendamentos" value={kpis.total} icon={CalendarClock} />
        <KPICard title="Em operação" value={kpis.inProg} icon={Truck} />
        <KPICard title="Concluídos" value={kpis.done} icon={CheckCircle2} />
        <KPICard title="Cancelados / No-show" value={kpis.issues} icon={AlertTriangle} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Timeline do dia</CardTitle>
          <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="w-auto" />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid" style={{ gridTemplateColumns: '160px 1fr' }}>
                <div />
                <div className="relative h-6 border-b">
                  {hours.map((h, i) => (
                    <div
                      key={h}
                      className="absolute top-0 text-xs text-muted-foreground"
                      style={{ left: `${(i / (hours.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
                {docks.length === 0 && (
                  <div className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma doca cadastrada.
                  </div>
                )}
                {docks.map((d) => (
                  <div key={d.id} className="contents">
                    <div className="py-3 pr-2 text-sm font-medium border-b">
                      {d.name}
                      <div className="text-xs text-muted-foreground">{d.type || '—'}</div>
                    </div>
                    <div className="relative h-14 border-b bg-muted/20">
                      {(byDock.get(d.id) || []).map((a) => (
                        <div
                          key={a.id}
                          className="absolute top-2 bottom-2 rounded-md border bg-primary/15 hover:bg-primary/25 transition-colors px-2 py-1 overflow-hidden cursor-pointer"
                          style={blockStyle(a)}
                          title={`${a.carrier_name || '—'} • ${a.plate || ''} • ${STATUS_LABEL[a.status] || a.status}`}
                        >
                          <div className="text-xs font-medium truncate">{a.carrier_name || 'Sem transportadora'}</div>
                          <div className="text-[10px] truncate">{a.plate} • {STATUS_LABEL[a.status] || a.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Agendamentos do dia</CardTitle></CardHeader>
        <CardContent>
          {appts.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Nenhum agendamento.</div>
          ) : (
            <div className="space-y-2">
              {appts.map((a) => {
                const dock = docks.find((d) => d.id === a.dock_id);
                return (
                  <div key={a.id} className="flex items-center justify-between border rounded-md p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_VARIANT[a.status] || 'outline'}>{STATUS_LABEL[a.status] || a.status}</Badge>
                        <span className="text-sm font-medium">{dock?.name || '—'}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} →
                          {' '}{new Date(a.scheduled_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.carrier_name || '—'} • {a.plate || '—'} • {a.operation_type === 'inbound' ? 'Recebimento' : 'Expedição'}
                        {a.linked_order ? ` • Pedido ${a.linked_order}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {a.status === 'scheduled' && (
                        <Button size="sm" variant="outline" onClick={() => changeStatus(a.id, 'arrived')}>Chegou</Button>
                      )}
                      {(a.status === 'scheduled' || a.status === 'arrived') && (
                        <Button size="sm" onClick={() => changeStatus(a.id, 'in_progress')}>Iniciar</Button>
                      )}
                      {a.status === 'in_progress' && (
                        <Button size="sm" onClick={() => changeStatus(a.id, 'completed')}>Concluir</Button>
                      )}
                      {a.status === 'scheduled' && (
                        <Button size="sm" variant="destructive" onClick={() => changeStatus(a.id, 'no_show')}>No-show</Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
