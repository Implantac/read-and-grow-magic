import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionOrderRow {
  id: string;
  order_number: string;
  product_id: string | null;
  product_code: string;
  product_name: string;
  quantity: number;
  produced_quantity: number;
  unit: string;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  work_center: string | null;
  operator: string | null;
  notes: string | null;
  bom_id: string | null;
  route_id: string | null;
  created_at: string;
}

export function useProductionOrders() {
  const [orders, setOrders] = useState<ProductionOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('production_orders').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar ordens de produção'); }
    else setOrders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (id: string, updates: Partial<ProductionOrderRow>) => {
    const { error } = await supabase.from('production_orders').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar ordem'); return; }
    toast.success('Ordem atualizada');
    await fetch();
  };

  return { orders, loading, refetch: fetch, update };
}
