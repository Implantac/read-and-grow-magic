import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toastSuccess, toastError, handleMutationError } from '@/lib/toastHelpers';
import { geocodeAddress } from '@/lib/geocode';
import { nearestNeighborTsp, checkTimeWindows } from '@/lib/tspOptimize';
import { parseCsv, STOP_CSV_TEMPLATE } from '@/lib/csvImport';

type Reorder = { mutate: (args: { routeId: string; ordered: string[] }, opts?: any) => void };
type CreateStop = { mutateAsync: (payload: any) => Promise<any> };

export function useRoutePlannerActions(params: {
  routeId?: string;
  stops: any[];
  depot?: { depot_latitude?: number | null; depot_longitude?: number | null } | null;
  createStop: CreateStop;
  reorder: Reorder;
}) {
  const { routeId, stops, depot, createStop, reorder } = params;
  const qc = useQueryClient();
  const [computing, setComputing] = useState(false);
  const [bulkGeocoding, setBulkGeocoding] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const computeEta = async () => {
    if (!routeId) return;
    setComputing(true);
    try {
      const { error } = await supabase.rpc('fn_route_compute_eta', { _route_id: routeId });
      if (error) throw error;
      toastSuccess('ETAs recalculados');
      qc.invalidateQueries({ queryKey: ['route_stops', routeId] });
    } catch (e) {
      handleMutationError(e);
    } finally {
      setComputing(false);
    }
  };

  const bulkGeocode = async () => {
    if (!routeId) return;
    const pending = stops.filter((s) => s.latitude == null || s.longitude == null);
    if (pending.length === 0) {
      toastSuccess('Todas as paradas já possuem coordenadas');
      return;
    }
    setBulkGeocoding(true);
    let ok = 0, fail = 0;
    try {
      for (const s of pending) {
        try {
          const r = await geocodeAddress({
            address: s.address ?? '', city: s.city ?? '', state: s.state ?? '', zip: s.zip_code ?? '',
          });
          if (r) {
            const { error } = await supabase.from('route_stops')
              .update({ latitude: r.latitude, longitude: r.longitude }).eq('id', s.id);
            if (error) throw error;
            ok++;
          } else fail++;
        } catch { fail++; }
        await new Promise((res) => setTimeout(res, 1100));
      }
      qc.invalidateQueries({ queryKey: ['route_stops', routeId] });
      toastSuccess('Geocodificação concluída',
        `${ok} parada(s) atualizada(s)${fail ? ` · ${fail} não encontrada(s)` : ''}`);
    } finally {
      setBulkGeocoding(false);
    }
  };

  const downloadCsvTemplate = () => {
    const blob = new Blob([STOP_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'modelo-paradas.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = async (file: File) => {
    if (!routeId) return;
    setImporting(true);
    let ok = 0, fail = 0;
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) { toastError('CSV vazio ou sem cabeçalho válido.'); return; }
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
            route_id: routeId, sequence: baseSeq + i + 1, customer_name: name,
            address: r.address || null, city: r.city || null, state: r.state || null,
            zip_code: r.zip_code || null,
            latitude: Number.isFinite(lat as number) ? lat : null,
            longitude: Number.isFinite(lng as number) ? lng : null,
            weight_kg: Number.isFinite(weight as number) ? weight : null,
            notes: r.notes || null,
            time_window_start: r.time_window_start || null,
            time_window_end: r.time_window_end || null,
            status: 'pending',
          });
          ok++;
        } catch { fail++; }
      }
      qc.invalidateQueries({ queryKey: ['route_stops', routeId] });
      toastSuccess('Importação concluída', `${ok} parada(s) criada(s)${fail ? ` · ${fail} com erro` : ''}`);
    } catch (e) {
      handleMutationError(e);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const optimizeRoute = () => {
    if (!routeId) return;
    if (depot?.depot_latitude == null || depot?.depot_longitude == null) {
      toastError('Defina as coordenadas do CD para otimizar a rota.'); return;
    }
    const geocoded = stops.filter((s) => s.latitude != null && s.longitude != null);
    if (geocoded.length < 2) {
      toastError('Pelo menos 2 paradas precisam estar geocodificadas.'); return;
    }
    const geoPoints = stops.map((s) => ({
      id: s.id, latitude: s.latitude, longitude: s.longitude,
      timeWindowStart: s.time_window_start ?? null,
      timeWindowEnd: s.time_window_end ?? null,
      serviceMinutes: s.service_minutes ?? 10,
    }));
    const depotPt = { lat: depot.depot_latitude as number, lng: depot.depot_longitude as number };
    const res = nearestNeighborTsp(geoPoints, depotPt);
    const feas = checkTimeWindows(res.ordered, geoPoints, depotPt);
    reorder.mutate({ routeId, ordered: res.ordered }, {
      onSuccess: () => {
        const parts = [
          `${res.ordered.length - res.skipped} parada(s) reordenadas`,
          `${res.totalKm.toFixed(1)} km`,
          `≈ ${Math.round(feas.totalMinutes / 60 * 10) / 10} h`,
        ];
        if (feas.lateCount > 0) parts.push(`⚠ ${feas.lateCount} fora da janela`);
        if (res.skipped) parts.push(`${res.skipped} sem geocoding ao final`);
        if (feas.lateCount > 0) toastError('Rota otimizada com violações', parts.join(' · '));
        else toastSuccess('Rota otimizada', parts.join(' · '));
      },
    });
  };

  return {
    computing, bulkGeocoding, importing, fileInputRef,
    computeEta, bulkGeocode, downloadCsvTemplate, handleImportCsv, optimizeRoute,
  };
}
