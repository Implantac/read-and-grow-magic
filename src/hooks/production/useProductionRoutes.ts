import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionRouteStep {
  id: string;
  route_id: string;
  sequence: number;
  step_name: string;
  sector_id: string | null;
  resource_id: string | null;
  setup_time_minutes: number;
  operation_time_minutes: number;
  description: string | null;
  created_at: string;
  sector_name?: string;
  resource_name?: string;
}

export interface ProductionRouteRow {
  id: string;
  code: string;
  product_id: string | null;
  product_code: string | null;
  product_name: string | null;
  version: string;
  description: string | null;
  is_active: boolean;
  total_time_minutes: number;
  created_at: string;
  updated_at: string;
  steps?: ProductionRouteStep[];
}

export function useProductionRoutes() {
  const [routes, setRoutes] = useState<ProductionRouteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('production_routes')
      .select('*')
      .order('code');
    if (error) { console.error(error); toast.error('Erro ao carregar rotas'); }
    else setRoutes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (item: Partial<ProductionRouteRow>) => {
    const { error } = await supabase.from('production_routes').insert(item);
    if (error) { toast.error('Erro ao criar rota'); return false; }
    toast.success('Rota cadastrada');
    await fetch();
    return true;
  };

  const update = async (id: string, updates: Partial<ProductionRouteRow>) => {
    const { error } = await supabase.from('production_routes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar rota'); return false; }
    toast.success('Rota atualizada');
    await fetch();
    return true;
  };

  const remove = async (id: string) => {
    // Delete steps first (cascade should handle, but be safe)
    await supabase.from('production_route_steps').delete().eq('route_id', id);
    const { error } = await supabase.from('production_routes').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir rota'); return; }
    toast.success('Rota excluída');
    await fetch();
  };

  return { routes, loading, refetch: fetch, create, update, remove };
}

export function useProductionRouteSteps(routeId?: string) {
  const [steps, setSteps] = useState<ProductionRouteStep[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!routeId) { setSteps([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('production_route_steps')
      .select('*, production_sectors(name), production_resources(name)')
      .eq('route_id', routeId)
      .order('sequence');
    if (error) { console.error(error); }
    else setSteps((data || []).map((d: any) => ({
      ...d,
      sector_name: d.production_sectors?.name,
      resource_name: d.production_resources?.name,
    })));
    setLoading(false);
  }, [routeId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addStep = async (step: Partial<ProductionRouteStep>) => {
    const { error } = await supabase.from('production_route_steps').insert({ ...step, route_id: routeId });
    if (error) { toast.error('Erro ao adicionar etapa'); return false; }
    toast.success('Etapa adicionada');
    await fetch();
    // Update total time on route
    await recalcTotalTime();
    return true;
  };

  const updateStep = async (id: string, updates: Partial<ProductionRouteStep>) => {
    const { error } = await supabase.from('production_route_steps').update(updates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar etapa'); return; }
    await fetch();
    await recalcTotalTime();
  };

  const removeStep = async (id: string) => {
    const { error } = await supabase.from('production_route_steps').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir etapa'); return; }
    toast.success('Etapa removida');
    await fetch();
    await recalcTotalTime();
  };

  const recalcTotalTime = async () => {
    if (!routeId) return;
    const { data } = await supabase.from('production_route_steps').select('setup_time_minutes, operation_time_minutes').eq('route_id', routeId);
    const total = (data || []).reduce((s: number, r: any) => s + (r.setup_time_minutes || 0) + (r.operation_time_minutes || 0), 0);
    await supabase.from('production_routes').update({ total_time_minutes: total, updated_at: new Date().toISOString() }).eq('id', routeId);
  };

  return { steps, loading, refetch: fetch, addStep, updateStep, removeStep };
}
