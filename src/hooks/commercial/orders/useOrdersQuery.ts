import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCanalStore } from '@/stores/useCanalStore';
import type { DbOrder, DbOrderItem } from './types';

export type OrderWithItems = DbOrder & { order_items?: DbOrderItem[] };

export function useOrders() {
  const { canal, branchId } = useCanalStore();
  return useQuery({
    queryKey: ['orders', canal, branchId],
    queryFn: async () => {
      let q = supabase.from('orders').select('*, order_items(*)');
      if (canal !== 'CONSOLIDADO') q = q.eq('canal_operacional', canal);
      if (branchId) q = q.eq('branch_id', branchId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as OrderWithItems[]).map((o) => ({
        ...o,
        items: o.order_items || [],
      })) as DbOrder[];
    },
  });
}
