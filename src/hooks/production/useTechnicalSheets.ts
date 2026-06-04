import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TechnicalSheetRow {
  id: string;
  product_id: string | null;
  product_code: string;
  product_name: string;
  steps: any[];
  materials: any[];
  total_time_minutes: number;
  standard_cost: number;
  version: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export function useTechnicalSheets() {
  const [sheets, setSheets] = useState<TechnicalSheetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('product_technical_sheets').select('*').order('product_name');
    if (error) { console.error(error); toast.error('Erro ao carregar fichas técnicas'); }
    else setSheets(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (item: Partial<TechnicalSheetRow>) => {
    const { error } = await (supabase as any).from('product_technical_sheets').insert(item);
    if (error) { toast.error('Erro ao criar ficha técnica'); return false; }
    toast.success('Ficha técnica criada');
    await fetchData();
    return true;
  };

  const update = async (id: string, updates: Partial<TechnicalSheetRow>) => {
    const { error } = await (supabase as any).from('product_technical_sheets').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    toast.success('Ficha atualizada');
    await fetchData();
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from('product_technical_sheets').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Ficha excluída');
    await fetchData();
  };

  return { sheets, loading, refetch: fetchData, create, update, remove };
}
