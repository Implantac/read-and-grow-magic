import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export interface CreateSaleInput {
  client_id?: string | null;
  client_name: string;
  payment_method: string;
  notes?: string | null;
  items: Array<{
    product_id?: string | null;
    product_name: string;
    product_code: string;
    quantity: number;
    unit_price: number;
    discount: number;
  }>;
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

export function useCreateSale() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      const { count } = await supabase.from('sales').select('id', { count: 'exact', head: true });
      const nextNum = `VND${String((count || 0) + 1).padStart(4, '0')}`;

      const subtotal = input.items.reduce((s, i) => s + (i.quantity * i.unit_price), 0);
      const discount = input.items.reduce((s, i) => s + i.discount, 0);
      const total = subtotal - discount;

      const { data: sale, error: saleError } = await supabase.from('sales').insert({
        number: nextNum,
        client_id: input.client_id || null,
        client_name: input.client_name,
        payment_method: input.payment_method,
        subtotal,
        discount,
        total,
        notes: input.notes || null,
        status: 'completed',
      }).select().single();
      if (saleError) throw saleError;

      const items = input.items.map((item) => ({
        sale_id: sale.id,
        product_id: item.product_id || null,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.quantity * item.unit_price - item.discount,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(items);
      if (itemsError) throw itemsError;

      return sale;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      toast({ title: 'Venda registrada com sucesso!' });
    },
    onError: (e: any) => toast({ title: 'Erro ao registrar venda', description: e.message, variant: 'destructive' }),
  });
}
