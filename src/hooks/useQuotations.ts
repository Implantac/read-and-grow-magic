import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DbQuotationItem {
  id: string;
  quotation_id: string;
  product_id: string | null;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface DbQuotation {
  id: string;
  number: string;
  client_id: string | null;
  client_name: string;
  date: string;
  valid_until: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  sales_rep_id: string | null;
  sales_rep_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: DbQuotationItem[];
}

export function useQuotations() {
  return useQuery({
    queryKey: ['quotations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, quotation_items(*)')
        .order('date', { ascending: false });
      if (error) throw error;
      return (data as any[]).map((q) => ({
        ...q,
        items: q.quotation_items || [],
      })) as DbQuotation[];
    },
  });
}

export function useUpdateQuotationStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('quotations').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotations'] });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}
