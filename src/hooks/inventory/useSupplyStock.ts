import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupplyItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  max_quantity: number;
  unit_cost: number;
  total_value: number;
  supplier: string | null;
  location: string | null;
  category: string | null;
  last_entry_date: string | null;
  last_exit_date: string | null;
  status: string;
  created_at: string;
}

export interface SupplyMovement {
  id: string;
  supply_id: string;
  supply_code: string;
  supply_name: string;
  type: string;
  direction: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  production_order_id: string | null;
  production_order_number: string | null;
  document_number: string | null;
  operator: string | null;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export function useSupplyStock() {
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [movements, setMovements] = useState<SupplyMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSupplies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('supply_stock').select('*').order('name');
    if (error) { console.error(error); toast.error('Erro ao carregar insumos'); }
    else setSupplies(data || []);
    setLoading(false);
  }, []);

  const fetchMovements = useCallback(async () => {
    const { data, error } = await supabase.from('supply_movements').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) console.error(error);
    else setMovements(data || []);
  }, []);

  useEffect(() => { fetchSupplies(); fetchMovements(); }, [fetchSupplies, fetchMovements]);

  const createSupply = async (supply: Partial<SupplyItem>) => {
    const totalValue = (supply.current_quantity || 0) * (supply.unit_cost || 0);
    const { error } = await supabase.from('supply_stock').insert({ ...supply, total_value: totalValue });
    if (error) { toast.error('Erro ao criar insumo'); return false; }
    toast.success('Insumo cadastrado');
    await fetchSupplies();
    return true;
  };

  const updateSupply = async (id: string, updates: Partial<SupplyItem>) => {
    const { error } = await supabase.from('supply_stock').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar insumo'); return; }
    await fetchSupplies();
  };

  const registerMovement = async (movement: Partial<SupplyMovement>) => {
    const { error: movErr } = await supabase.from('supply_movements').insert(movement);
    if (movErr) { toast.error('Erro ao registrar movimentação'); return false; }

    // Update supply stock
    const supply = supplies.find(s => s.id === movement.supply_id);
    if (supply) {
      const newQty = movement.direction === 'in'
        ? supply.current_quantity + (movement.quantity || 0)
        : supply.current_quantity - (movement.quantity || 0);
      const newTotal = newQty * supply.unit_cost;
      const dateField = movement.direction === 'in' ? 'last_entry_date' : 'last_exit_date';
      await supabase.from('supply_stock').update({
        current_quantity: Math.max(0, newQty),
        total_value: Math.max(0, newTotal),
        [dateField]: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', movement.supply_id);
    }

    toast.success('Movimentação registrada');
    await fetchSupplies();
    await fetchMovements();
    return true;
  };

  const lowStockItems = supplies.filter(s => s.current_quantity <= s.min_quantity && s.status === 'active');

  return { supplies, movements, loading, refetch: fetchSupplies, createSupply, updateSupply, registerMovement, lowStockItems };
}
