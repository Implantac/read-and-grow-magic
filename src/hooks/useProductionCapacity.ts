import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionCapacityRow {
  id: string;
  sector: string;
  machine: string | null;
  operator_name: string | null;
  shift: string;
  capacity_per_hour: number;
  max_hours_per_day: number;
  current_load_pct: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export function useProductionCapacity() {
  const [capacities, setCapacities] = useState<ProductionCapacityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('production_capacity').select('*').order('sector');
    if (error) { console.error(error); toast.error('Erro ao carregar capacidade'); }
    else setCapacities(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (item: Partial<ProductionCapacityRow>) => {
    const { error } = await (supabase as any).from('production_capacity').insert(item);
    if (error) { toast.error('Erro ao criar capacidade'); return false; }
    toast.success('Capacidade cadastrada');
    await fetchData();
    return true;
  };

  const update = async (id: string, updates: Partial<ProductionCapacityRow>) => {
    const { error } = await (supabase as any).from('production_capacity').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    toast.success('Atualizado');
    await fetchData();
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from('production_capacity').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Excluído');
    await fetchData();
  };

  return { capacities, loading, refetch: fetchData, create, update, remove };
}
