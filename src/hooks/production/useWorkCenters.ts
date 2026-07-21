import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WorkCenterRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  capacity: number;
  is_active: boolean;
  current_load: number;
  created_at: string;
  updated_at: string;
}

export function useWorkCenters() {
  const [workCenters, setWorkCenters] = useState<WorkCenterRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('work_centers').select('*').order('name');
    if (error) { console.error(error); }
    else setWorkCenters(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (item: Partial<WorkCenterRow>) => {
    const { error } = await supabase.from('work_centers').insert(item);
    if (error) { toast.error('Erro ao criar centro de trabalho'); return false; }
    toast.success('Centro de trabalho criado');
    await fetchData();
    return true;
  };

  const update = async (id: string, updates: Partial<WorkCenterRow>) => {
    const { error } = await supabase.from('work_centers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    toast.success('Atualizado');
    await fetchData();
  };

  return { workCenters, loading, refetch: fetchData, create, update };
}
