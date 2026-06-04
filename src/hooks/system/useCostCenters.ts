import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toastError, toastSuccess } from '@/lib/toastHelpers';

export interface CostCenterRow {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCostCenters() {
  return useQuery({
    queryKey: ['cost_centers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cost_centers').select('*').order('code');
      if (error) throw error;
      return data as CostCenterRow[];
    },
  });
}

export function useCreateCostCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cc: { code: string; name: string; parent_id?: string | null }) => {
      const { data, error } = await supabase.from('cost_centers').insert(cc).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cost_centers'] }); toastSuccess('Sucesso', 'Centro de custo criado'); },
    onError: () => toastError('Erro ao criar centro de custo'),
  });
}
