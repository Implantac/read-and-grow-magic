import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionResource {
  id: string;
  code: string;
  name: string;
  resource_type: string;
  sector_id: string | null;
  line_id: string | null;
  capacity_per_hour: number;
  cost_per_hour: number;
  status: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sector_name?: string;
  line_name?: string;
}

export function useProductionResources() {
  const [resources, setResources] = useState<ProductionResource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('production_resources')
      .select('*, production_sectors(name), production_lines(name)')
      .order('code');
    if (error) { console.error(error); toast.error('Erro ao carregar recursos'); }
    else setResources((data || []).map((d: any) => ({
      ...d,
      sector_name: d.production_sectors?.name,
      line_name: d.production_lines?.name,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (item: Partial<ProductionResource>) => {
    const { error } = await supabase.from('production_resources').insert(item);
    if (error) { toast.error('Erro ao criar recurso'); return false; }
    toast.success('Recurso cadastrado');
    await fetch();
    return true;
  };

  const update = async (id: string, updates: Partial<ProductionResource>) => {
    const { error } = await supabase.from('production_resources').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar recurso'); return false; }
    toast.success('Recurso atualizado');
    await fetch();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('production_resources').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir recurso'); return; }
    toast.success('Recurso excluído');
    await fetch();
  };

  return { resources, loading, refetch: fetch, create, update, remove };
}
