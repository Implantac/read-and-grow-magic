import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Disposition = 'restock' | 'quarantine' | 'scrap' | 'return_supplier' | 'rework';

export interface ReturnItem {
  id: string;
  return_id: string;
  company_id: string;
  product_id: string | null;
  product_sku: string | null;
  product_name: string | null;
  lot_id: string | null;
  location_id: string | null;
  quantity: number;
  unit: string | null;
  disposition: Disposition | null;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  inspection_notes: string | null;
  inspected_at: string | null;
  processed_at: string | null;
  created_at: string;
}

export function useReturnItems(returnId: string | null) {
  return useQuery({
    queryKey: ['wms_return_items', returnId],
    enabled: !!returnId,
    queryFn: async (): Promise<ReturnItem[]> => {
      const { data, error } = await supabase
        .from('wms_return_items')
        .select('*')
        .eq('return_id', returnId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReturnItem[];
    },
  });
}

export function useDisposeReturnItem(returnId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { itemId: string; disposition: Disposition; notes?: string }) => {
      const { data, error } = await supabase.rpc('wms_dispose_return_item' as any, {
        _item_id: params.itemId,
        _disposition: params.disposition,
        _notes: params.notes ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Disposição aplicada');
      qc.invalidateQueries({ queryKey: ['wms_return_items', returnId] });
      qc.invalidateQueries({ queryKey: ['wms_returns'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao aplicar disposição'),
  });
}
