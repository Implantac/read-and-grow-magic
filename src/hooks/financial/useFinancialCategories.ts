import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface FinancialCategoryRow {
  id: string;
  code: string;
  name: string;
  type: 'income' | 'expense' | 'cost' | 'transfer';
  parent_id: string | null;
  color: string;
  active: boolean;
  created_at: string;
}

export function useFinancialCategories() {
  return useQuery({
    queryKey: ['financial_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .eq('active', true)
        .order('code');
      if (error) throw error;
      return data as FinancialCategoryRow[];
    },
  });
}

export function useCreateFinancialCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: Omit<FinancialCategoryRow, 'id' | 'created_at' | 'active'>) => {
      const company_id = useEnterpriseStore.getState().activeCompanyId;
      if (!company_id) throw new Error('Empresa não selecionada');
      const { data, error } = await supabase
        .from('financial_categories')
        .insert({ ...cat, company_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_categories'] });
      toastSuccess('Categoria criada');
    },
    onError: handleMutationError,
  });
}
