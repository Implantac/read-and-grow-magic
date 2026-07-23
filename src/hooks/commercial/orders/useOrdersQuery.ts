import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCanalStore } from '@/stores/useCanalStore';
import type { DbOrder, DbOrderItem } from './types';

export function useOrders() {
  const { canal, branchId } = useCanalStore();
  return useQuery({
    queryKey: ['orders', canal, branchId],
    queryFn: async () => {
      let q: any = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (canal !== 'CONSOLIDADO') q = q.eq('canal_operacional', canal);
      if (branchId) q = q.eq('branch_id', branchId);
      const { data, error } = await q;
      if (error) throw error;
      type OrderWithItems = DbOrder & { order_items?: DbOrderItem[] };
      return (data as OrderWithItems[]).map((o) => ({
        ...o,
        items: o.order_items || [],
      })) as DbOrder[];
    },
  });
}
