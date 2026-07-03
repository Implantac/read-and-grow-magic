import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * useSales — hoje derivado de `orders` (a tabela `sales` legada foi descontinuada).
 * Mantém o formato { client_id, date, total, status, items:[{product_id}] }
 * consumido por useSalesIntelligence / dashboards comerciais.
 *
 * Considera apenas pedidos faturados/entregues (venda efetivada).
 */
const REALIZED_STATUSES = ['invoiced', 'billed', 'delivered', 'completed', 'finalized'];

export function useSales() {
  return useQuery({
    queryKey: ['sales', 'derived-from-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, client_id, date, total, status, order_items(product_id)')
        .in('status', REALIZED_STATUSES)
        .order('date', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map((o: any) => ({
        id: o.id,
        client_id: o.client_id ?? undefined,
        date: o.date,
        total: Number(o.total) || 0,
        status: o.status,
        items: (o.order_items ?? []).map((i: any) => ({ product_id: i.product_id ?? undefined })),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
