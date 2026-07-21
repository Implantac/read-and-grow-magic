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
import { Badge } from '@/ui/base/badge';
import { Dialog, DialogTrigger } from '@/ui/base/dialog';
import { Plus, MapPin, Truck, DollarSign, Fuel, ChevronLeft, Clock, Loader2, GripVertical, Wand2, Download, ExternalLink, Upload, FileDown } from 'lucide-react';
import { toastSuccess, toastError, handleMutationError } from '@/lib/toastHelpers';
import { geocodeAddress } from '@/lib/geocode';
import { nearestNeighborTsp, checkTimeWindows } from '@/lib/tspOptimize';
import { buildRouteGpx, buildGoogleMapsUrl, downloadGpx } from '@/lib/routeExport';
import { parseCsv, STOP_CSV_TEMPLATE } from '@/lib/csvImport';
import { useRef } from 'react';

import {
  useRouteStops,
  useCreateRouteStop,
  useUpdateRouteStop,
  useDeleteRouteStop,
  useReorderStops,
  useRouteCost,
  useUpsertRouteCost,
} from '@/hooks/tms/useRoutePlanning';
import { useTMS } from '@/hooks/operational/useTMSQuery';
import { StopRow, CostLine } from './route-planner/StopRow';
import { StopDialog } from './route-planner/StopDialog';
import { CostDialog } from './route-planner/CostDialog';

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
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const downloadCsvTemplate = () => {
    const blob = new Blob([STOP_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-paradas.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = async (file: File) => {
    if (!id || !route) return;
    setImporting(true);
    let ok = 0;
    let fail = 0;
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        toastError('CSV vazio ou sem cabeçalho válido.');
        return;
      }
      const baseSeq = stops.length;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const name = r.customer_name || r.cliente || r.nome;
        if (!name) { fail++; continue; }
        const lat = r.latitude ? Number(r.latitude.replace(',', '.')) : null;
        const lng = r.longitude ? Number(r.longitude.replace(',', '.')) : null;
        const weight = r.weight_kg ? Number(r.weight_kg.replace(',', '.')) : null;
        try {
          await createStop.mutateAsync({
            route_id: id,
            sequence: baseSeq + i + 1,
            customer_name: name,
            address: r.address || null,
            city: r.city || null,
            state: r.state || null,
            zip_code: r.zip_code || null,
            latitude: Number.isFinite(lat as number) ? lat : null,
            longitude: Number.isFinite(lng as number) ? lng : null,
            weight_kg: Number.isFinite(weight as number) ? weight : null,
            notes: r.notes || null,
            time_window_start: r.time_window_start || null,
            time_window_end: r.time_window_end || null,
            status: 'pending',
          } as any);
          ok++;
        } catch {
          fail++;
        }
      }
      qc.invalidateQueries({ queryKey: ['route_stops', id] });
      toastSuccess('Importação concluída', `${ok} parada(s) criada(s)${fail ? ` · ${fail} com erro` : ''}`);
    } catch (e) {
      handleMutationError(e);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportCsv(f);
              }}
            />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              Importar CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={downloadCsvTemplate} title="Baixar modelo de CSV">
              <FileDown className="h-4 w-4 mr-1" />
              Modelo
            </Button>
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
            onReorder={(ordered) => {
              if (!route?.id) return;
              reorder.mutate({ routeId: route.id, ordered });
            }}
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

export default RoutePlanner;
