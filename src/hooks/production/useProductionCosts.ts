import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionCostRow {
  id: string;
  production_order_id: string | null;
  raw_material_cost: number;
  labor_cost: number;
  operational_cost: number;
  total_cost: number;
  sale_price: number;
  profit_margin: number;
  profit_per_unit: number;
  quantity: number;
  notes: string | null;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

export function useProductionCostsOP() {
  const [costs, setCosts] = useState<ProductionCostRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('production_costs').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); }
    else setCosts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const upsert = async (cost: Partial<ProductionCostRow>) => {
    const { error } = await supabase.from('production_costs').upsert(cost, { onConflict: 'production_order_id' });
    if (error) { toast.error('Erro ao salvar custo'); return; }
    toast.success('Custo calculado');
    await fetchData();
  };

  return { costs, loading, refetch: fetchData, upsert };
}
