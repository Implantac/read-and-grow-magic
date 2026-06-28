import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Input } from '@/ui/base/input';
import { Label } from '@/ui/base/label';
import { Badge } from '@/ui/base/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/base/dialog';
import { ArrowUp, ArrowDown, Trash2, Plus, MapPin, Truck, DollarSign, Fuel, ChevronLeft } from 'lucide-react';
import {
  useRouteStops,
  useCreateRouteStop,
  useUpdateRouteStop,
  useDeleteRouteStop,
  useReorderStops,
  useRouteCost,
  useUpsertRouteCost,
  type RouteStop,
} from '@/hooks/tms/useRoutePlanning';
import { useTMS } from '@/hooks/operational/useTMSQuery';

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  en_route: { label: 'Em rota', variant: 'default' },
  arrived: { label: 'Chegou', variant: 'default' },
  completed: { label: 'Concluída', variant: 'outline' },
  failed: { label: 'Falhou', variant: 'destructive' },
  skipped: { label: 'Pulada', variant: 'secondary' },
};

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const RoutePlanner = () => {
  const { id } = useParams<{ id: string }>();
  const { routes, routesLoading } = useTMS();
  const route = routes.find((r) => r.id === id);

  const { data: stops = [], isLoading: stopsLoading } = useRouteStops(id);
  const { data: cost } = useRouteCost(id);
  const createStop = useCreateRouteStop();
  const updateStop = useUpdateRouteStop();
  const deleteStop = useDeleteRouteStop();
  const reorder = useReorderStops();
  const upsertCost = useUpsertRouteCost();

  const [open, setOpen] = useState(false);
  const [costOpen, setCostOpen] = useState(false);

  const summary = useMemo(() => {
    const totalWeight = stops.reduce((s, x) => s + Number(x.weight ?? 0), 0);
    const totalVolume = stops.reduce((s, x) => s + Number(x.volume ?? 0), 0);
    const completed = stops.filter((s) => s.status === 'completed').length;
    return { totalWeight, totalVolume, completed };
  }, [stops]);

  const totalCost = useMemo(() => {
    if (!cost) return 0;
    return (
      Number(cost.fuel_cost ?? 0) +
      Number(cost.toll_cost ?? 0) +
      Number(cost.driver_cost ?? 0) +
      Number(cost.maintenance_cost ?? 0) +
      Number(cost.other_cost ?? 0)
    );
  }, [cost]);

  const costPerStop = stops.length > 0 ? totalCost / stops.length : 0;
  const costPerKm =
    cost && Number(cost.total_distance_km ?? 0) > 0
      ? totalCost / Number(cost.total_distance_km)
      : 0;

  if (routesLoading || stopsLoading) return <PageLoading />;
  if (!route) {
    return (
      <PageContainer>
        <PageHeader title="Rota não encontrada" />
        <Link to="/tms/rotas" className="text-primary underline inline-flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Voltar para rotas
        </Link>
      </PageContainer>
    );
  }

  const move = (index: number, dir: -1 | 1) => {
    const next = [...stops];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate({ routeId: route.id, ordered: next.map((s) => s.id) });
  };

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/tms/rotas"><ChevronLeft className="h-4 w-4 mr-1" />Rotas</Link>
        </Button>
      </div>
      <PageHeader
        title={`Planejamento — ${route.routeNumber ?? route.id.slice(0, 8)}`}
        description={`Motorista: ${route.driverName ?? '—'} · Data: ${route.plannedDate ?? '—'} · Status: ${route.status}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Paradas" value={`${summary.completed}/${stops.length}`} icon={<MapPin className="h-5 w-5" />} accentColor="primary" index={0} />
        <KPICard title="Peso total (kg)" value={summary.totalWeight.toLocaleString('pt-BR')} icon={<Truck className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Custo total" value={fmtBRL(totalCost)} icon={<DollarSign className="h-5 w-5" />} accentColor="warning" index={2} />
        <KPICard title="Custo / parada" value={fmtBRL(costPerStop)} icon={<Fuel className="h-5 w-5" />} accentColor="success" index={3} />
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Paradas da rota</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova parada</Button>
            </DialogTrigger>
            <StopDialog
              routeId={route.id}
              nextSeq={stops.length + 1}
              onClose={() => setOpen(false)}
              onSubmit={(payload) => {
                createStop.mutate(payload, { onSuccess: () => setOpen(false) });
              }}
            />
          </Dialog>
        </CardHeader>
        <CardContent>
          {stops.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhuma parada cadastrada. Adicione a primeira para começar a planejar a rota.
            </div>
          ) : (
            <div className="space-y-2">
              {stops.map((s, idx) => (
                <StopRow
                  key={s.id}
                  stop={s}
                  canUp={idx > 0}
                  canDown={idx < stops.length - 1}
                  onUp={() => move(idx, -1)}
                  onDown={() => move(idx, 1)}
                  onStatus={(status) => updateStop.mutate({ id: s.id, updates: { status } })}
                  onDelete={() => deleteStop.mutate({ id: s.id, routeId: route.id })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Custos da rota</CardTitle>
            {cost && Number(cost.total_distance_km ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {fmtBRL(costPerKm)} / km · {Number(cost.total_distance_km).toLocaleString('pt-BR')} km
              </p>
            )}
          </div>
          <Dialog open={costOpen} onOpenChange={setCostOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">Editar custos</Button>
            </DialogTrigger>
            <CostDialog
              routeId={route.id}
              current={cost}
              onClose={() => setCostOpen(false)}
              onSubmit={(payload) => {
                upsertCost.mutate(payload, { onSuccess: () => setCostOpen(false) });
              }}
            />
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <CostLine label="Combustível" value={fmtBRL(Number(cost?.fuel_cost ?? 0))} />
            <CostLine label="Pedágios" value={fmtBRL(Number(cost?.toll_cost ?? 0))} />
            <CostLine label="Motorista" value={fmtBRL(Number(cost?.driver_cost ?? 0))} />
            <CostLine label="Manutenção" value={fmtBRL(Number(cost?.maintenance_cost ?? 0))} />
            <CostLine label="Outros" value={fmtBRL(Number(cost?.other_cost ?? 0))} />
            <CostLine label="Litros" value={`${Number(cost?.fuel_liters ?? 0).toLocaleString('pt-BR')} L`} />
            <CostLine label="Distância" value={`${Number(cost?.total_distance_km ?? 0).toLocaleString('pt-BR')} km`} />
            <CostLine label="Total" value={fmtBRL(totalCost)} highlight />
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

const CostLine = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`rounded-lg border p-3 ${highlight ? 'border-primary/40 bg-primary/5' : 'border-border/40'}`}>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className={`font-semibold ${highlight ? 'text-primary' : ''}`}>{value}</div>
  </div>
);

const StopRow = ({
  stop, canUp, canDown, onUp, onDown, onStatus, onDelete,
}: {
  stop: RouteStop;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onStatus: (status: string) => void;
  onDelete: () => void;
}) => {
  const s = STATUS_LABEL[stop.status] ?? STATUS_LABEL.pending;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
        {stop.sequence}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{stop.address}</div>
        <div className="text-xs text-muted-foreground">
          {stop.city ?? ''}{stop.state ? ` / ${stop.state}` : ''}
          {Number(stop.weight ?? 0) > 0 && ` · ${Number(stop.weight)} kg`}
          {stop.planned_eta && ` · ETA ${new Date(stop.planned_eta).toLocaleString('pt-BR')}`}
        </div>
      </div>
      <Badge variant={s.variant}>{s.label}</Badge>
      <Select value={stop.status} onValueChange={onStatus}>
        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="icon" variant="ghost" disabled={!canUp} onClick={onUp}><ArrowUp className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" disabled={!canDown} onClick={onDown}><ArrowDown className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>
  );
};

const StopDialog = ({
  routeId, nextSeq, onClose, onSubmit,
}: {
  routeId: string;
  nextSeq: number;
  onClose: () => void;
  onSubmit: (payload: any) => void;
}) => {
  const [form, setForm] = useState({
    address: '', city: '', state: '', zip_code: '',
    weight: '', volume: '', stop_type: 'delivery', planned_eta: '', notes: '',
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.address.trim()) return;
    onSubmit({
      route_id: routeId,
      sequence: nextSeq,
      stop_type: form.stop_type,
      address: form.address.trim(),
      city: form.city || null,
      state: form.state || null,
      zip_code: form.zip_code || null,
      weight: form.weight ? Number(form.weight.replace(',', '.')) : 0,
      volume: form.volume ? Number(form.volume.replace(',', '.')) : 0,
      planned_eta: form.planned_eta ? new Date(form.planned_eta).toISOString() : null,
      notes: form.notes || null,
    });
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Nova parada</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Tipo</Label>
          <Select value={form.stop_type} onValueChange={(v) => set('stop_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="delivery">Entrega</SelectItem>
              <SelectItem value="pickup">Coleta</SelectItem>
              <SelectItem value="depot">Depósito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Endereço *</Label>
          <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
          <div><Label>UF</Label><Input maxLength={2} value={form.state} onChange={(e) => set('state', e.target.value.toUpperCase())} /></div>
          <div><Label>CEP</Label><Input value={form.zip_code} onChange={(e) => set('zip_code', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Peso (kg)</Label><Input value={form.weight} onChange={(e) => set('weight', e.target.value)} /></div>
          <div><Label>Volume (m³)</Label><Input value={form.volume} onChange={(e) => set('volume', e.target.value)} /></div>
        </div>
        <div>
          <Label>ETA prevista</Label>
          <Input type="datetime-local" value={form.planned_eta} onChange={(e) => set('planned_eta', e.target.value)} />
        </div>
        <div>
          <Label>Notas</Label>
          <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit}>Adicionar</Button>
      </DialogFooter>
    </DialogContent>
  );
};

const CostDialog = ({
  routeId, current, onClose, onSubmit,
}: {
  routeId: string;
  current: any;
  onClose: () => void;
  onSubmit: (payload: any) => void;
}) => {
  const toStr = (v: any) => (v == null ? '' : String(v));
  const [form, setForm] = useState({
    fuel_liters: toStr(current?.fuel_liters),
    fuel_cost: toStr(current?.fuel_cost),
    toll_cost: toStr(current?.toll_cost),
    driver_cost: toStr(current?.driver_cost),
    maintenance_cost: toStr(current?.maintenance_cost),
    other_cost: toStr(current?.other_cost),
    total_distance_km: toStr(current?.total_distance_km),
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const num = (s: string) => (s ? Number(s.replace(',', '.')) || 0 : 0);

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Custos da rota</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Combustível (L)</Label><Input value={form.fuel_liters} onChange={(e) => set('fuel_liters', e.target.value)} /></div>
        <div><Label>Combustível (R$)</Label><Input value={form.fuel_cost} onChange={(e) => set('fuel_cost', e.target.value)} /></div>
        <div><Label>Pedágios (R$)</Label><Input value={form.toll_cost} onChange={(e) => set('toll_cost', e.target.value)} /></div>
        <div><Label>Motorista (R$)</Label><Input value={form.driver_cost} onChange={(e) => set('driver_cost', e.target.value)} /></div>
        <div><Label>Manutenção (R$)</Label><Input value={form.maintenance_cost} onChange={(e) => set('maintenance_cost', e.target.value)} /></div>
        <div><Label>Outros (R$)</Label><Input value={form.other_cost} onChange={(e) => set('other_cost', e.target.value)} /></div>
        <div className="col-span-2"><Label>Distância total (km)</Label><Input value={form.total_distance_km} onChange={(e) => set('total_distance_km', e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSubmit({
          route_id: routeId,
          fuel_liters: num(form.fuel_liters),
          fuel_cost: num(form.fuel_cost),
          toll_cost: num(form.toll_cost),
          driver_cost: num(form.driver_cost),
          maintenance_cost: num(form.maintenance_cost),
          other_cost: num(form.other_cost),
          total_distance_km: num(form.total_distance_km),
        })}>Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default RoutePlanner;
