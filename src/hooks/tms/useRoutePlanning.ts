import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
import type { Database } from '@/integrations/supabase/types';

export type RouteStop = Database['public']['Tables']['route_stops']['Row'];
export type RouteStopInsert = Database['public']['Tables']['route_stops']['Insert'];
export type RouteStopUpdate = Database['public']['Tables']['route_stops']['Update'];
export type RouteCost = Database['public']['Tables']['route_costs']['Row'];

export function useRouteStops(routeId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!routeId) return;
    const ch = supabase
      .channel(`route_stops:${routeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'route_stops', filter: `route_id=eq.${routeId}` },
        () => qc.invalidateQueries({ queryKey: ['route_stops', routeId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [routeId, qc]);

  return useQuery({
    queryKey: ['route_stops', routeId],
    enabled: !!routeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('route_stops')
        .select('*')
        .eq('route_id', routeId!)
        .order('sequence');
      if (error) throw error;
      return data as RouteStop[];
    },
  });
}

export function useCreateRouteStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stop: Omit<RouteStopInsert, 'company_id'>) => {
      const company_id = useEnterpriseStore.getState().activeCompanyId;
      if (!company_id) throw new Error('Empresa não selecionada');
      const { data, error } = await supabase
        .from('route_stops')
        .insert({ ...stop, company_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['route_stops', row.route_id] });
      toastSuccess('Parada adicionada');
    },
    onError: handleMutationError,
  });
}

export function useUpdateRouteStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RouteStopUpdate }) => {
      const { data, error } = await supabase
        .from('route_stops')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['route_stops', row.route_id] });
    },
    onError: handleMutationError,
  });
}

export function useDeleteRouteStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, routeId }: { id: string; routeId: string }) => {
      const { error } = await supabase.from('route_stops').delete().eq('id', id);
      if (error) throw error;
      return routeId;
    },
    onSuccess: (routeId) => {
      qc.invalidateQueries({ queryKey: ['route_stops', routeId] });
      toastSuccess('Parada removida');
    },
    onError: handleMutationError,
  });
}

export function useReorderStops() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ routeId, ordered }: { routeId: string; ordered: string[] }) => {
      // Two-phase to avoid unique (route_id, sequence) collisions
      for (let i = 0; i < ordered.length; i++) {
        const { error } = await supabase
          .from('route_stops')
          .update({ sequence: 1000 + i })
          .eq('id', ordered[i]);
        if (error) throw error;
      }
      for (let i = 0; i < ordered.length; i++) {
        const { error } = await supabase
          .from('route_stops')
          .update({ sequence: i + 1 })
          .eq('id', ordered[i]);
        if (error) throw error;
      }
      return routeId;
    },
    onSuccess: (routeId) => {
      qc.invalidateQueries({ queryKey: ['route_stops', routeId] });
      toastSuccess('Ordem das paradas atualizada');
    },
    onError: handleMutationError,
  });
}

export function useRouteCost(routeId?: string) {
  return useQuery({
    queryKey: ['route_costs', routeId],
    enabled: !!routeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('route_costs')
        .select('*')
        .eq('route_id', routeId!)
        .maybeSingle();
      if (error) throw error;
      return data as RouteCost | null;
    },
  });
}

export function useUpsertRouteCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any & { route_id: string }) => {
      const company_id = useEnterpriseStore.getState().activeCompanyId;
      if (!company_id) throw new Error('Empresa não selecionada');
      const { data, error } = await supabase
        .from('route_costs')
        .upsert(
          { ...payload, company_id },
          { onConflict: 'route_id' },
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ['route_costs', row.route_id] });
      toastSuccess('Custos salvos');
    },
    onError: handleMutationError,
  });
}

/** Live tracking: routes currently in-transit (realtime via route_stops). */
export function useLiveRoutes() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel('tms-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'route_stops' },
        () => qc.invalidateQueries({ queryKey: ['live_routes'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_routes' },
        () => qc.invalidateQueries({ queryKey: ['live_routes'] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return useQuery({
    queryKey: ['live_routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_routes')
        .select('*')
        .in('status', ['in_transit', 'planned'])
        .order('planned_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
