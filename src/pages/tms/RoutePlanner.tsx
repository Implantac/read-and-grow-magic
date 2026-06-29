import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { RouteMap } from '@/components/tms/RouteMap';
import { supabase } from '@/integrations/supabase/client';
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
import { ArrowUp, ArrowDown, Trash2, Plus, MapPin, Truck, DollarSign, Fuel, ChevronLeft, Clock, Loader2, Search, GripVertical, Wand2, Download, ExternalLink } from 'lucide-react';
import { toastSuccess, toastError, handleMutationError } from '@/lib/toastHelpers';
import { lookupCep, geocodeAddress } from '@/lib/geocode';
import { nearestNeighborTsp, checkTimeWindows } from '@/lib/tspOptimize';
import { buildRouteGpx, buildGoogleMapsUrl, downloadGpx } from '@/lib/routeExport';

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

  const qc = useQueryClient();
  const [computing, setComputing] = useState(false);
  const [bulkGeocoding, setBulkGeocoding] = useState(false);

  const { data: depot } = useQuery({
    queryKey: ['delivery_route_depot', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_routes')
        .select('depot_latitude, depot_longitude')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });


  const computeEta = async () => {
    if (!id) return;
    setComputing(true);
    try {
      const { error } = await supabase.rpc('fn_route_compute_eta', { _route_id: id });
      if (error) throw error;
      toastSuccess('ETAs recalculados');
      qc.invalidateQueries({ queryKey: ['route_stops', id] });
    } catch (e) {
      handleMutationError(e);
    } finally {
      setComputing(false);
    }
  };

  const missingGeo = useMemo(
    () => stops.filter((s) => s.latitude == null || s.longitude == null).length,
    [stops],
  );

  const bulkGeocode = async () => {
    if (!id) return;
    const pending = stops.filter(
      (s) => s.latitude == null || s.longitude == null,
    );
    if (pending.length === 0) {
      toastSuccess('Todas as paradas já possuem coordenadas');
      return;
    }
    setBulkGeocoding(true);
    let ok = 0;
    let fail = 0;
    try {
      for (const s of pending) {
        try {
          const r = await geocodeAddress({
            address: s.address ?? '',
            city: s.city ?? '',
            state: s.state ?? '',
            zip: s.zip_code ?? '',
          });
          if (r) {
            const { error } = await supabase
              .from('route_stops')
              .update({ latitude: r.latitude, longitude: r.longitude })
              .eq('id', s.id);
            if (error) throw error;
            ok++;
          } else {
            fail++;
          }
        } catch {
          fail++;
        }
        // Nominatim asks for max 1 req/s
        await new Promise((res) => setTimeout(res, 1100));
      }
      qc.invalidateQueries({ queryKey: ['route_stops', id] });
      toastSuccess(
        'Geocodificação concluída',
        `${ok} parada(s) atualizada(s)${fail ? ` · ${fail} não encontrada(s)` : ''}`,
      );
    } finally {
      setBulkGeocoding(false);
    }
  };

  const geocodedCount = useMemo(
    () => stops.filter((s) => s.latitude != null && s.longitude != null).length,
    [stops],
  );

  const optimizeRoute = () => {
    if (!route) return;
    if (depot?.depot_latitude == null || depot?.depot_longitude == null) {
      toastError('Defina as coordenadas do CD para otimizar a rota.');
      return;
    }
    if (geocodedCount < 2) {
      toastError('Pelo menos 2 paradas precisam estar geocodificadas.');
      return;
    }
    const geoPoints = stops.map((s) => ({
      id: s.id,
      latitude: s.latitude,
      longitude: s.longitude,
      timeWindowStart: (s as any).time_window_start ?? null,
      timeWindowEnd: (s as any).time_window_end ?? null,
      serviceMinutes: (s as any).service_minutes ?? 10,
    }));
    const depotPt = { lat: depot.depot_latitude as number, lng: depot.depot_longitude as number };
    const res = nearestNeighborTsp(geoPoints, depotPt);
    const feas = checkTimeWindows(res.ordered, geoPoints, depotPt);
    reorder.mutate(
      { routeId: route.id, ordered: res.ordered },
      {
        onSuccess: () => {
          const parts = [
            `${res.ordered.length - res.skipped} parada(s) reordenadas`,
            `${res.totalKm.toFixed(1)} km`,
            `≈ ${Math.round(feas.totalMinutes / 60 * 10) / 10} h`,
          ];
          if (feas.lateCount > 0) parts.push(`⚠ ${feas.lateCount} fora da janela`);
          if (res.skipped) parts.push(`${res.skipped} sem geocoding ao final`);
          if (feas.lateCount > 0) {
            toastError('Rota otimizada com violações', parts.join(' · '));
          } else {
            toastSuccess('Rota otimizada', parts.join(' · '));
          }
        },
      },
    );
  };

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

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const feasibilityMap = useMemo(() => {
    if (!stops.length || depot?.depot_latitude == null || depot?.depot_longitude == null) {
      return {} as Record<string, { status: 'ok'|'early'|'late'|'no-window'|'no-geo'; arrivalMin?: number; windowEndMin?: number | null }>;
    }
    const geoPoints = stops.map((s) => ({
      id: s.id,
      latitude: s.latitude,
      longitude: s.longitude,
      timeWindowStart: (s as any).time_window_start ?? null,
      timeWindowEnd: (s as any).time_window_end ?? null,
      serviceMinutes: (s as any).service_minutes ?? 10,
    }));
    const fz = checkTimeWindows(
      stops.map((s) => s.id),
      geoPoints,
      { lat: depot.depot_latitude as number, lng: depot.depot_longitude as number },
    );
    const out: Record<string, { status: 'ok'|'early'|'late'|'no-window'|'no-geo'; arrivalMin?: number; windowEndMin?: number | null }> = {};
    for (const r of fz.stops) out[r.id] = { status: r.status, arrivalMin: r.arrivalMin, windowEndMin: r.windowEndMin };
    return out;
  }, [stops, depot]);

  const lateCount = useMemo(
    () => Object.values(feasibilityMap).filter((f) => f.status === 'late').length,
    [feasibilityMap],
  );




  if (routesLoading || stopsLoading) return <PageLoading />;
  if (!route) {
    return (
      <PageContainer>
        <PageHeader title="Rota não encontrada" description="A rota selecionada não existe ou foi removida." />
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

  const handleDrop = (target: number) => {
    if (dragIndex === null || dragIndex === target) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const next = [...stops];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    reorder.mutate({ routeId: route.id, ordered: next.map((s) => s.id) });
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-2 mb-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/tms/rotas"><ChevronLeft className="h-4 w-4 mr-1" />Rotas</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to={`/tms/rotas/${route.id}/manifesto`}>Imprimir manifesto</Link>
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
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={bulkGeocode} disabled={bulkGeocoding || missingGeo === 0}>
              {bulkGeocoding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MapPin className="h-4 w-4 mr-1" />}
              Geocodificar paradas{missingGeo > 0 ? ` (${missingGeo})` : ''}
            </Button>
            <Button size="sm" variant="outline" onClick={computeEta} disabled={computing || stops.length === 0}>
              {computing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Clock className="h-4 w-4 mr-1" />}
              Calcular ETA
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={optimizeRoute}
              disabled={reorder.isPending || stops.length < 2}
              title="Reordena as paradas pelo menor caminho (nearest neighbor)"
            >
              <Wand2 className="h-4 w-4 mr-1" />
              Otimizar rota
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const geocoded = stops.filter((s) => s.latitude != null && s.longitude != null);
                if (geocoded.length === 0) {
                  toastError('Nenhuma parada geocodificada para exportar.');
                  return;
                }
                const gpx = buildRouteGpx({
                  routeName: `Rota ${route.routeNumber ?? route.id.slice(0, 8)}`,
                  depot,
                  stops: stops as any,
                });
                downloadGpx(`rota-${route.routeNumber ?? route.id.slice(0, 8)}`, gpx);
                toastSuccess(`GPX exportado (${geocoded.length} paradas)`);
              }}
              disabled={stops.length === 0}
              title="Baixar arquivo GPX para Garmin, Waze, OsmAnd e Google Earth"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar GPX
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const url = buildGoogleMapsUrl({ depot, stops: stops as any });
                if (!url) {
                  toastError('Geocodifique as paradas antes de abrir no Google Maps.');
                  return;
                }
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
              disabled={stops.length === 0}
              title="Abrir rota completa no Google Maps"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Google Maps
            </Button>

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
          </div>
        </CardHeader>
        <CardContent>
          {stops.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhuma parada cadastrada. Adicione a primeira para começar a planejar a rota.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-1">Arraste pelo ícone <GripVertical className="inline h-3 w-3" /> para reordenar — o mapa atualiza automaticamente.</p>
              {stops.map((s, idx) => (
                <StopRow
                  key={s.id}
                  stop={s}
                  late={feasibilityMap[s.id]?.status === 'late'}
                  canUp={idx > 0}
                  canDown={idx < stops.length - 1}
                  onUp={() => move(idx, -1)}
                  onDown={() => move(idx, 1)}
                  onStatus={(status) => updateStop.mutate({ id: s.id, updates: { status } })}
                  onDelete={() => deleteStop.mutate({ id: s.id, routeId: route.id })}
                  isDragging={dragIndex === idx}
                  isOver={overIndex === idx && dragIndex !== null && dragIndex !== idx}
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => { e.preventDefault(); if (overIndex !== idx) setOverIndex(idx); }}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                  onDrop={() => handleDrop(idx)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Mapa da rota</CardTitle>
          {lateCount > 0 && (
            <Badge variant="destructive">
              {lateCount} parada{lateCount > 1 ? 's' : ''} fora da janela
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <RouteMap
            stops={stops}
            depot={{ lat: depot?.depot_latitude as number | null, lng: depot?.depot_longitude as number | null }}
            height={400}
            feasibility={feasibilityMap}
          />
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
  stop, late, canUp, canDown, onUp, onDown, onStatus, onDelete,
  isDragging, isOver, onDragStart, onDragOver, onDragEnd, onDrop,
}: {
  stop: RouteStop;
  late?: boolean;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onStatus: (status: string) => void;
  onDelete: () => void;
  isDragging?: boolean;
  isOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
}) => {
  const s = STATUS_LABEL[stop.status] ?? STATUS_LABEL.pending;
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
        isDragging ? 'opacity-50 border-primary' : isOver ? 'border-primary bg-primary/5' : late ? 'border-destructive/50 bg-destructive/5' : 'border-border/40'
      }`}
    >
      <button
        type="button"
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        aria-label="Arrastar para reordenar"
        title="Arrastar para reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
        {stop.sequence}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{stop.address}</div>
        <div className="text-xs text-muted-foreground">
          {stop.city ?? ''}{stop.state ? ` / ${stop.state}` : ''}
          {Number(stop.weight ?? 0) > 0 && ` · ${Number(stop.weight)} kg`}
          {stop.planned_eta && ` · ETA ${new Date(stop.planned_eta).toLocaleString('pt-BR')}`}
          {(stop as any).time_window_start && (stop as any).time_window_end && (
            ` · Janela ${String((stop as any).time_window_start).slice(0, 5)}–${String((stop as any).time_window_end).slice(0, 5)}`
          )}
        </div>
      </div>
      {late && <Badge variant="destructive">Atrasada</Badge>}
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
    latitude: '', longitude: '',
    time_window_start: '', time_window_end: '', service_minutes: '10',
  });
  const [geocoding, setGeocoding] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const onCepBlur = async () => {
    if (!form.zip_code || form.zip_code.replace(/\D/g, '').length !== 8) return;
    setCepLoading(true);
    try {
      const r = await lookupCep(form.zip_code);
      if (r) {
        setForm((p) => ({
          ...p,
          city: p.city || r.city || '',
          state: p.state || r.state || '',
          address: p.address || [r.street, r.neighborhood].filter(Boolean).join(', '),
        }));
      }
    } finally {
      setCepLoading(false);
    }
  };

  const onGeocode = async () => {
    if (!form.address.trim() && !form.zip_code) {
      toastError(null, 'Informe endereço ou CEP antes de buscar coordenadas.');
      return;
    }
    setGeocoding(true);
    try {
      const r = await geocodeAddress({
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip_code,
      });
      if (!r) {
        toastError(null, 'Não foi possível localizar este endereço.');
        return;
      }
      setForm((p) => ({
        ...p,
        latitude: r.latitude.toFixed(6),
        longitude: r.longitude.toFixed(6),
      }));
      toastSuccess('Coordenadas encontradas', r.displayName);
    } finally {
      setGeocoding(false);
    }
  };

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
      latitude: form.latitude ? Number(form.latitude.replace(',', '.')) : null,
      longitude: form.longitude ? Number(form.longitude.replace(',', '.')) : null,
      weight: form.weight ? Number(form.weight.replace(',', '.')) : 0,
      volume: form.volume ? Number(form.volume.replace(',', '.')) : 0,
      planned_eta: form.planned_eta ? new Date(form.planned_eta).toISOString() : null,
      time_window_start: form.time_window_start || null,
      time_window_end: form.time_window_end || null,
      service_minutes: form.service_minutes ? Math.max(0, parseInt(form.service_minutes, 10) || 0) : 10,
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
          <div>
            <Label>CEP {cepLoading && <Loader2 className="inline h-3 w-3 ml-1 animate-spin" />}</Label>
            <Input value={form.zip_code} onChange={(e) => set('zip_code', e.target.value)} onBlur={onCepBlur} />
          </div>
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div><Label>Latitude</Label><Input value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="-23.5505" /></div>
          <div><Label>Longitude</Label><Input value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="-46.6333" /></div>
          <Button type="button" variant="outline" size="sm" onClick={onGeocode} disabled={geocoding}>
            {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Peso (kg)</Label><Input value={form.weight} onChange={(e) => set('weight', e.target.value)} /></div>
          <div><Label>Volume (m³)</Label><Input value={form.volume} onChange={(e) => set('volume', e.target.value)} /></div>
        </div>
        <div>
          <Label>ETA prevista</Label>
          <Input type="datetime-local" value={form.planned_eta} onChange={(e) => set('planned_eta', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>Janela início</Label>
            <Input type="time" value={form.time_window_start} onChange={(e) => set('time_window_start', e.target.value)} />
          </div>
          <div>
            <Label>Janela fim</Label>
            <Input type="time" value={form.time_window_end} onChange={(e) => set('time_window_end', e.target.value)} />
          </div>
          <div>
            <Label>Serviço (min)</Label>
            <Input type="number" min={0} value={form.service_minutes} onChange={(e) => set('service_minutes', e.target.value)} />
          </div>
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
