import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductCost {
  id: string;
  product_id: string | null;
  product_code: string;
  product_name: string;
  raw_material_cost: number;
  labor_cost: number;
  production_time_minutes: number;
  labor_rate_per_hour: number;
  operational_cost: number;
  total_cost: number;
  sale_price: number;
  profit_margin: number;
  profit_value: number;
  last_calculated_at: string;
  notes: string | null;
  created_at: string;
}

export function useProductCosts() {
  const [costs, setCosts] = useState<ProductCost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('product_costs').select('*').order('product_name');
    if (error) { console.error(error); toast.error('Erro ao carregar custos'); }
    else setCosts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCosts(); }, [fetchCosts]);

  const calculateCost = (raw: number, laborRate: number, timeMin: number, operational: number, salePrice: number) => {
    const laborCost = (laborRate / 60) * timeMin;
    const totalCost = raw + laborCost + operational;
    const profitValue = salePrice - totalCost;
    const profitMargin = salePrice > 0 ? (profitValue / salePrice) * 100 : 0;
    return { labor_cost: laborCost, total_cost: totalCost, profit_value: profitValue, profit_margin: profitMargin };
  };

  const createCost = async (cost: Partial<ProductCost>) => {
    const calc = calculateCost(
      cost.raw_material_cost || 0,
      cost.labor_rate_per_hour || 0,
      cost.production_time_minutes || 0,
      cost.operational_cost || 0,
      cost.sale_price || 0,
    );
    const { error } = await supabase.from('product_costs').insert({
      ...cost, ...calc, last_calculated_at: new Date().toISOString(),
    });
    if (error) { toast.error('Erro ao criar custo'); return false; }
    toast.success('Custo cadastrado');
    await fetchCosts();
    return true;
  };

  const updateCost = async (id: string, updates: Partial<ProductCost>) => {
    const existing = costs.find(c => c.id === id);
    const merged = { ...existing, ...updates };
    const calc = calculateCost(
      merged.raw_material_cost || 0,
      merged.labor_rate_per_hour || 0,
      merged.production_time_minutes || 0,
      merged.operational_cost || 0,
      merged.sale_price || 0,
    );
    const { error } = await supabase.from('product_costs').update({
      ...updates, ...calc, last_calculated_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar custo'); return; }
    toast.success('Custo atualizado');
    await fetchCosts();
  };

  const deleteCost = async (id: string) => {
    const { error } = await supabase.from('product_costs').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir custo'); return; }
    toast.success('Custo excluído');
    await fetchCosts();
  };

  // Summary stats
  const avgMargin = costs.length > 0 ? costs.reduce((s, c) => s + c.profit_margin, 0) / costs.length : 0;
  const totalRevenue = costs.reduce((s, c) => s + c.sale_price, 0);
  const totalCostSum = costs.reduce((s, c) => s + c.total_cost, 0);
  const lowMarginProducts = costs.filter(c => c.profit_margin < 15);
  const highCostProducts = costs.filter(c => c.total_cost > c.sale_price * 0.8);

  return {
    costs, loading, refetch: fetchCosts, createCost, updateCost, deleteCost, calculateCost,
    avgMargin, totalRevenue, totalCostSum, lowMarginProducts, highCostProducts,
  };
}
