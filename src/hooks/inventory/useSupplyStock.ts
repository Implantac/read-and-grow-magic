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
    else setSupplies((data || []) as SupplyItem[]);
    setLoading(false);
  }, []);

  const fetchMovements = useCallback(async () => {
    const { data, error } = await supabase.from('supply_movements').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) console.error(error);
    else setMovements((data || []) as SupplyMovement[]);
  }, []);

  useEffect(() => { fetchSupplies(); fetchMovements(); }, [fetchSupplies, fetchMovements]);

  const createSupply = async (supply: Partial<SupplyItem>) => {
    const totalValue = (supply.current_quantity || 0) * (supply.unit_cost || 0);
    const { error } = await supabase.from('supply_stock').insert({
      code: supply.code!,
      name: supply.name!,
      unit: supply.unit!,
      ...supply,
      total_value: totalValue,
    });
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
    const { error: movErr } = await supabase.from('supply_movements').insert({
      supply_id: movement.supply_id!,
      supply_code: movement.supply_code!,
      supply_name: movement.supply_name!,
      type: movement.type!,
      direction: movement.direction!,
      quantity: movement.quantity!,
      unit_cost: movement.unit_cost ?? 0,
      total_cost: movement.total_cost ?? 0,
      production_order_id: movement.production_order_id ?? null,
      production_order_number: movement.production_order_number ?? null,
      document_number: movement.document_number ?? null,
      operator: movement.operator ?? null,
      reason: movement.reason ?? null,
      notes: movement.notes ?? null,
    });
    if (movErr) { toast.error('Erro ao registrar movimentação'); return false; }

    // Update supply stock
    const supply = supplies.find(s => s.id === movement.supply_id);
    if (supply) {
      const newQty = movement.direction === 'in'
        ? supply.current_quantity + (movement.quantity || 0)
        : supply.current_quantity - (movement.quantity || 0);
      const newTotal = newQty * supply.unit_cost;
      const nowIso = new Date().toISOString();
      const payload = movement.direction === 'in'
        ? { current_quantity: Math.max(0, newQty), total_value: Math.max(0, newTotal), last_entry_date: nowIso, updated_at: nowIso }
        : { current_quantity: Math.max(0, newQty), total_value: Math.max(0, newTotal), last_exit_date: nowIso, updated_at: nowIso };
      await supabase.from('supply_stock').update(payload).eq('id', movement.supply_id!);
    }

    toast.success('Movimentação registrada');
    await fetchSupplies();
    await fetchMovements();
    return true;
  };

  const lowStockItems = supplies.filter(s => s.current_quantity <= s.min_quantity && s.status === 'active');

  return { supplies, movements, loading, refetch: fetchSupplies, createSupply, updateSupply, registerMovement, lowStockItems };
}
