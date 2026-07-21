import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MaterialConsumptionRow {
  id: string;
  production_order_id: string | null;
  order_number: string;
  component_code: string;
  component_name: string;
  expected_quantity: number;
  consumed_quantity: number;
  unit: string;
  consumed_at: string | null;
  consumed_by: string | null;
  batch: string | null;
  location: string | null;
  created_at: string;
}

export function useMaterialConsumptions() {
  const [consumptions, setConsumptions] = useState<MaterialConsumptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('material_consumptions').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar consumos'); }
    else setConsumptions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (id: string, updates: Partial<MaterialConsumptionRow>) => {
    const { error } = await supabase.from('material_consumptions').update(updates as any).eq('id', id);
    if (error) { toast.error('Erro ao atualizar consumo'); return; }
    await fetch();
  };

  return { consumptions, loading, refetch: fetch, update };
}
