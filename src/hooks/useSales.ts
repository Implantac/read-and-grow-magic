import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DbSaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface DbSale {
  id: string;
  number: string;
  client_id: string | null;
  client_name: string;
  date: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  status: string;
  sales_rep_id: string | null;
  sales_rep_name: string | null;
  notes: string | null;
  created_at: string;
  items?: DbSaleItem[];
}

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .order('date', { ascending: false });
      if (error) throw error;
      return (data as any[]).map((s) => ({
        ...s,
        items: s.sale_items || [],
      })) as DbSale[];
    },
  });
}
