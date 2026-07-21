import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OutsourcingOrderRow {
  id: string;
  production_order_id: string;
  order_number: string;
  supplier_name: string;
  supplier_id: string | null;
  service_description: string | null;
  sent_date: string;
  expected_return_date: string | null;
  actual_return_date: string | null;
  quantity_sent: number;
  quantity_returned: number;
  quantity_rejected: number;
  unit_cost: number;
  total_cost: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useOutsourcingOrders() {
  const [orders, setOrders] = useState<OutsourcingOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('outsourcing_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast.error('Erro ao carregar ordens de terceirização');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const create = async (order: Partial<OutsourcingOrderRow>) => {
    const { error } = await supabase.from('outsourcing_orders').insert(order);
    if (error) { toast.error('Erro ao criar ordem de terceirização'); return false; }
    toast.success('Ordem de terceirização criada');
    await fetchData();
    return true;
  };

  const update = async (id: string, updates: Partial<OutsourcingOrderRow>) => {
    const { error } = await supabase
      .from('outsourcing_orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return false; }
    toast.success('Ordem atualizada');
    await fetchData();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('outsourcing_orders').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Ordem excluída');
    await fetchData();
  };

  // Detect late orders
  const lateOrders = orders.filter(o => {
    if (o.status === 'returned') return false;
    if (!o.expected_return_date) return false;
    return new Date(o.expected_return_date) < new Date();
  });

  return { orders, loading, refetch: fetchData, create, update, remove, lateOrders };
}
