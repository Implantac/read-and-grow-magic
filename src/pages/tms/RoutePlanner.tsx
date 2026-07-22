import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RouteMap } from '@/components/tms/RouteMap';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { ChevronLeft, DollarSign, Fuel, MapPin, Truck } from 'lucide-react';
import { checkTimeWindows } from '@/lib/tspOptimize';

import {
  useRouteStops, useCreateRouteStop, useUpdateRouteStop, useDeleteRouteStop,
  useReorderStops, useRouteCost, useUpsertRouteCost,
} from '@/hooks/tms/useRoutePlanning';
import { useTMS } from '@/hooks/operational/useTMSQuery';

import { fmtBRL } from './route-planner/helpers';
import { useRoutePlannerActions } from './route-planner/useRoutePlannerActions';
import { RouteToolbar } from './route-planner/RouteToolbar';
import { RouteCostCard } from './route-planner/RouteCostCard';
import { StopsList } from './route-planner/StopsList';

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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

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

  const actions = useRoutePlannerActions({
    routeId: id, stops, depot, createStop, reorder,
  });

  const missingGeo = useMemo(
    () => stops.filter((s) => s.latitude == null || s.longitude == null).length,
    [stops],
  );

  const summary = useMemo(() => {
    const totalWeight = stops.reduce((s, x) => s + Number(x.weight ?? 0), 0);
    const totalVolume = stops.reduce((s, x) => s + Number(x.volume ?? 0), 0);
    const completed = stops.filter((s) => s.status === 'completed').length;
    return { totalWeight, totalVolume, completed };
  }, [stops]);

  const totalCost = useMemo(() => {
    if (!cost) return 0;
    return (
      Number(cost.fuel_cost ?? 0) + Number(cost.toll_cost ?? 0) +
      Number(cost.driver_cost ?? 0) + Number(cost.maintenance_cost ?? 0) +
      Number(cost.other_cost ?? 0)
    );
  }, [cost]);

  const costPerStop = stops.length > 0 ? totalCost / stops.length : 0;
  const costPerKm = cost && Number(cost.total_distance_km ?? 0) > 0
    ? totalCost / Number(cost.total_distance_km) : 0;

  const feasibilityMap = useMemo(() => {
    if (!stops.length || depot?.depot_latitude == null || depot?.depot_longitude == null) {
      return {} as Record<string, { status: 'ok'|'early'|'late'|'no-window'|'no-geo'; arrivalMin?: number; windowEndMin?: number | null }>;
    }
    const geoPoints = stops.map((s: any) => ({
      id: s.id, latitude: s.latitude, longitude: s.longitude,
      timeWindowStart: s.time_window_start ?? null,
      timeWindowEnd: s.time_window_end ?? null,
      serviceMinutes: s.service_minutes ?? 10,
    }));
    const fz = checkTimeWindows(
      stops.map((s: any) => s.id), geoPoints,
      { lat: depot.depot_latitude as number, lng: depot.depot_longitude as number },
    );
    const out: Record<string, any> = {};
    for (const r of fz.stops) out[r.id] = { status: r.status, arrivalMin: r.arrivalMin, windowEndMin: r.windowEndMin };
    return out;
  }, [stops, depot]);

  const lateCount = useMemo(
    () => Object.values(feasibilityMap).filter((f: any) => f.status === 'late').length,
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
    reorder.mutate({ routeId: route.id, ordered: next.map((s: any) => s.id) });
  };

  const handleDrop = (target: number) => {
    if (dragIndex === null || dragIndex === target) {
      setDragIndex(null); setOverIndex(null); return;
    }
    const next = [...stops];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    reorder.mutate({ routeId: route.id, ordered: next.map((s: any) => s.id) });
    setDragIndex(null); setOverIndex(null);
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
          <RouteToolbar
            fileInputRef={actions.fileInputRef}
            importing={actions.importing}
            bulkGeocoding={actions.bulkGeocoding}
            computing={actions.computing}
            missingGeo={missingGeo}
            stops={stops}
            route={route}
            depot={depot}
            open={open}
            setOpen={setOpen}
            reorderPending={reorder.isPending}
            onImportCsv={actions.handleImportCsv}
            onDownloadTemplate={actions.downloadCsvTemplate}
            onBulkGeocode={actions.bulkGeocode}
            onComputeEta={actions.computeEta}
            onOptimize={actions.optimizeRoute}
            onCreateStop={(payload) => createStop.mutate(payload, { onSuccess: () => setOpen(false) })}
          />
        </CardHeader>
        <CardContent>
          <StopsList
            stops={stops}
            route={route}
            feasibilityMap={feasibilityMap}
            dragIndex={dragIndex}
            overIndex={overIndex}
            setDragIndex={setDragIndex}
            setOverIndex={setOverIndex}
            onMove={move}
            onStatus={(id, status) => updateStop.mutate({ id, updates: { status } })}
            onDelete={(sid) => deleteStop.mutate({ id: sid, routeId: route.id })}
            onDrop={handleDrop}
          />
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

      <RouteCostCard
        routeId={route.id}
        cost={cost}
        totalCost={totalCost}
        costPerKm={costPerKm}
        costOpen={costOpen}
        setCostOpen={setCostOpen}
        onSubmit={(payload) => upsertCost.mutate(payload, { onSuccess: () => setCostOpen(false) })}
      />
    </PageContainer>
  );
};

export default RoutePlanner;
