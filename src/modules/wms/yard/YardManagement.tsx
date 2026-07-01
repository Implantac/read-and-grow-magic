import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/ui/base/dialog';
import { Textarea } from '@/ui/base/textarea';
import { ScrollArea } from '@/ui/base/scroll-area';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Truck, ParkingSquare, CalendarClock, LogIn, LogOut, Plus, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface YardVehicle {
  id: string;
  plate: string;
  carrier_name: string | null;
  driver_name: string | null;
  vehicle_type: string;
  operation_type: string;
  status: string;
  dock_id: string | null;
  linked_order: string | null;
  arrived_at: string;
  docked_at: string | null;
  finished_at: string | null;
  notes: string | null;
}

interface YardAppointment {
  id: string;
  dock_id: string;
  carrier_name: string | null;
  plate: string | null;
  operation_type: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  linked_order: string | null;
}

interface Dock { id: string; name?: string; code?: string }

const statusBadge: Record<string, string> = {
  waiting: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  docked: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  loading: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  unloading: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  finished: 'bg-green-500/15 text-green-600 border-green-500/30',
  cancelled: 'bg-muted text-muted-foreground',
  scheduled: 'bg-violet-500/15 text-violet-600 border-violet-500/30',
  confirmed: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  in_progress: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  done: 'bg-green-500/15 text-green-600 border-green-500/30',
  no_show: 'bg-destructive/15 text-destructive border-destructive/30',
};

export default function YardManagement() {
  const qc = useQueryClient();
  const [openCheckin, setOpenCheckin] = useState(false);
  const [openAppt, setOpenAppt] = useState(false);

  const { data: vehicles = [], isLoading: loadingV, refetch: refetchV } = useQuery({
    queryKey: ['yard_vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yard_vehicles')
        .select('*')
        .order('arrived_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as YardVehicle[];
    },
  });

  const { data: appts = [], isLoading: loadingA, refetch: refetchA } = useQuery({
    queryKey: ['yard_appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yard_appointments')
        .select('*')
        .order('scheduled_start', { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data || []) as YardAppointment[];
    },
  });

  const { data: docks = [] } = useQuery({
    queryKey: ['wms_docks_min'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wms_docks').select('*').limit(100);
      if (error) throw error;
      return (data || []) as Dock[];
    },
  });

  const kpis = useMemo(() => {
    const waiting = vehicles.filter((v) => v.status === 'waiting').length;
    const docked = vehicles.filter((v) => ['docked', 'loading', 'unloading'].includes(v.status)).length;
    const today = new Date().toISOString().slice(0, 10);
    const apptsToday = appts.filter((a) => a.scheduled_start.slice(0, 10) === today).length;
    const noShow = appts.filter((a) => a.status === 'no_show').length;
    return { waiting, docked, apptsToday, noShow };
  }, [vehicles, appts]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, dock_id }: { id: string; status: string; dock_id?: string | null }) => {
      const patch: any = { status };
      if (status === 'docked') patch.docked_at = new Date().toISOString();
      if (status === 'finished' || status === 'cancelled') patch.finished_at = new Date().toISOString();
      if (dock_id !== undefined) patch.dock_id = dock_id;
      const { error } = await supabase.from('yard_vehicles').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status atualizado');
      qc.invalidateQueries({ queryKey: ['yard_vehicles'] });
    },
    onError: (e: any) => toast.error(e.message || 'Falha ao atualizar'),
  });

  const dockLabel = (id: string | null) => {
    if (!id) return '—';
    const d = docks.find((x) => x.id === id);
    return d?.name || d?.code || id.slice(0, 6);
  };

  return (
    <PageContainer>
      <PageHeader
        title="🚛 Yard Management"
        description="Pátio, check-in de veículos e agendamento de docas"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { refetchV(); refetchA(); }} className="h-8 gap-2">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Dialog open={openAppt} onOpenChange={setOpenAppt}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2"><CalendarClock className="h-4 w-4" /> Agendar</Button>
            </DialogTrigger>
            <AppointmentDialog docks={docks} onClose={() => setOpenAppt(false)} />
          </Dialog>
          <Dialog open={openCheckin} onOpenChange={setOpenCheckin}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-2"><Plus className="h-4 w-4" /> Check-in</Button>
            </DialogTrigger>
            <CheckinDialog docks={docks} onClose={() => setOpenCheckin(false)} />
          </Dialog>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Aguardando" value={kpis.waiting} subtitle="veículos no pátio" icon={<ParkingSquare className="h-5 w-5" />} accentColor={kpis.waiting > 5 ? 'warning' : 'default'} index={0} />
        <KPICard title="Em doca" value={kpis.docked} subtitle="carregando/descarregando" icon={<Truck className="h-5 w-5" />} accentColor="success" index={1} />
        <KPICard title="Agendamentos hoje" value={kpis.apptsToday} subtitle="janelas do dia" icon={<CalendarClock className="h-5 w-5" />} index={2} />
        <KPICard title="No-show" value={kpis.noShow} subtitle="histórico" icon={<LogOut className="h-5 w-5" />} accentColor={kpis.noShow > 0 ? 'danger' : 'default'} index={3} />
      </div>

      <Tabs defaultValue="yard">
        <TabsList>
          <TabsTrigger value="yard">Pátio em tempo real</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="yard">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Veículos no pátio ({vehicles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[520px] pr-3">
                {loadingV && <p className="text-sm text-muted-foreground">Carregando…</p>}
                {!loadingV && vehicles.length === 0 && (
                  <EmptyState icon={Truck} title="Pátio vazio" description="Faça o check-in de veículos que estão chegando para gerenciar docas e prioridades." />
                )}
                <div className="space-y-2">
                  {vehicles.map((v) => (
                    <div key={v.id} className="flex flex-wrap items-center gap-3 border rounded-lg p-3">
                      <Truck className="h-4 w-4 text-primary" />
                      <span className="font-mono font-semibold">{v.plate}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">{v.operation_type}</Badge>
                      <Badge variant="outline" className={`text-[10px] uppercase ${statusBadge[v.status] || ''}`}>{v.status}</Badge>
                      <span className="text-xs text-muted-foreground">{v.carrier_name || '—'}</span>
                      <span className="text-xs text-muted-foreground">Doca: {dockLabel(v.dock_id)}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        Chegou {format(new Date(v.arrived_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                      <div className="flex gap-1 w-full sm:w-auto pt-2 sm:pt-0">
                        {v.status === 'waiting' && (
                          <Select onValueChange={(dockId) => updateStatus.mutate({ id: v.id, status: 'docked', dock_id: dockId })}>
                            <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Atribuir doca" /></SelectTrigger>
                            <SelectContent>
                              {docks.map((d) => (
                                <SelectItem key={d.id} value={d.id}>{d.name || d.code || d.id.slice(0, 6)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {['docked', 'loading', 'unloading'].includes(v.status) && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updateStatus.mutate({ id: v.id, status: 'finished' })}>
                            <LogOut className="h-3 w-3" /> Liberar
                          </Button>
                        )}
                        {v.status !== 'finished' && v.status !== 'cancelled' && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: v.id, status: 'cancelled' })}>
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Agenda de docas ({appts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[520px] pr-3">
                {loadingA && <p className="text-sm text-muted-foreground">Carregando…</p>}
                {!loadingA && appts.length === 0 && (
                  <EmptyState icon={CalendarClock} title="Sem agendamentos" description="Programe janelas de docas para coletas e entregas evitando fila no pátio." />
                )}
                <div className="space-y-2">
                  {appts.map((a) => (
                    <div key={a.id} className="flex flex-wrap items-center gap-3 border rounded-lg p-3">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">
                        {format(new Date(a.scheduled_start), "dd/MM HH:mm", { locale: ptBR })} → {format(new Date(a.scheduled_end), "HH:mm", { locale: ptBR })}
                      </span>
                      <Badge variant="outline" className="text-[10px] uppercase">{a.operation_type}</Badge>
                      <Badge variant="outline" className={`text-[10px] uppercase ${statusBadge[a.status] || ''}`}>{a.status}</Badge>
                      <span className="text-xs text-muted-foreground">Doca: {dockLabel(a.dock_id)}</span>
                      <span className="text-xs text-muted-foreground">{a.carrier_name || '—'} {a.plate ? `· ${a.plate}` : ''}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function CheckinDialog({ docks, onClose }: { docks: Dock[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    plate: '', carrier_name: '', driver_name: '', driver_doc: '',
    vehicle_type: 'truck', operation_type: 'inbound', linked_order: '', notes: '',
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!form.plate.trim()) throw new Error('Placa é obrigatória');
      const { data: prof } = await supabase.from('profiles').select('company_id').maybeSingle();
      const companyId = prof?.company_id;
      if (!companyId) throw new Error('Empresa não identificada');
      const { error } = await supabase.from('yard_vehicles').insert({
        ...form,
        plate: form.plate.toUpperCase().trim(),
        company_id: companyId,
        status: 'waiting',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Check-in realizado');
      qc.invalidateQueries({ queryKey: ['yard_vehicles'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Falha no check-in'),
  });

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Check-in de veículo</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Placa *</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="ABC1D23" /></div>
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
          <div><Label>Transportadora</Label><Input value={form.carrier_name} onChange={(e) => setForm({ ...form, carrier_name: e.target.value })} /></div>
          <div><Label>Motorista</Label><Input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} /></div>
          <div><Label>Doc. motorista</Label><Input value={form.driver_doc} onChange={(e) => setForm({ ...form, driver_doc: e.target.value })} /></div>
          <div><Label>Pedido vinculado</Label><Input value={form.linked_order} onChange={(e) => setForm({ ...form, linked_order: e.target.value })} /></div>
        </div>
        <div><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
          <LogIn className="h-4 w-4" /> Registrar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function AppointmentDialog({ docks, onClose }: { docks: Dock[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    dock_id: '', carrier_name: '', plate: '', operation_type: 'inbound',
    scheduled_start: '', scheduled_end: '', linked_order: '', notes: '',
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!form.dock_id || !form.scheduled_start || !form.scheduled_end) throw new Error('Doca e horários são obrigatórios');
      const { data: prof } = await supabase.from('profiles').select('company_id').maybeSingle();
      const companyId = prof?.company_id;
      if (!companyId) throw new Error('Empresa não identificada');
      const { error } = await supabase.from('yard_appointments').insert({
        ...form,
        plate: form.plate ? form.plate.toUpperCase().trim() : null,
        company_id: companyId,
        status: 'scheduled',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Agendamento criado');
      qc.invalidateQueries({ queryKey: ['yard_appointments'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Falha ao agendar'),
  });

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Novo agendamento de doca</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Doca *</Label>
            <Select value={form.dock_id} onValueChange={(v) => setForm({ ...form, dock_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {docks.map((d) => <SelectItem key={d.id} value={d.id}>{d.name || d.code || d.id.slice(0, 6)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
          <div><Label>Início *</Label><Input type="datetime-local" value={form.scheduled_start} onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })} /></div>
          <div><Label>Fim *</Label><Input type="datetime-local" value={form.scheduled_end} onChange={(e) => setForm({ ...form, scheduled_end: e.target.value })} /></div>
          <div><Label>Transportadora</Label><Input value={form.carrier_name} onChange={(e) => setForm({ ...form, carrier_name: e.target.value })} /></div>
          <div><Label>Placa</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} /></div>
          <div className="col-span-2"><Label>Pedido vinculado</Label><Input value={form.linked_order} onChange={(e) => setForm({ ...form, linked_order: e.target.value })} /></div>
        </div>
        <div><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>Agendar</Button>
      </DialogFooter>
    </DialogContent>
  );
}
