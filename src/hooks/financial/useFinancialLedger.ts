import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface LedgerEntryRow {
  id: string;
  entry_date: string;
  type: 'inflow' | 'outflow';
  amount: number;
  description: string;
  bank_account_id: string | null;
  category_id: string | null;
  source: string;
  source_id: string | null;
  payment_method: string | null;
  reference: string | null;
  notes: string | null;
  reconciled: boolean;
  bank_transaction_id: string | null;
  created_at: string;
}

export function useFinancialLedger(filters?: { from?: string; to?: string; bank_account_id?: string }) {
  return useQuery({
    queryKey: ['financial_ledger', filters],
    queryFn: async () => {
      let q = supabase.from('financial_ledger').select('*').order('entry_date', { ascending: false });
      if (filters?.from) q = q.gte('entry_date', filters.from);
      if (filters?.to) q = q.lte('entry_date', filters.to);
      if (filters?.bank_account_id) q = q.eq('bank_account_id', filters.bank_account_id);
      const { data, error } = await q.limit(1000);
      if (error) throw error;
      return data as LedgerEntryRow[];
    },
  });
}

export function useCreateManualLedger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<LedgerEntryRow, 'id' | 'created_at' | 'reconciled' | 'bank_transaction_id'> & { source?: string }) => {
      const company_id = useEnterpriseStore.getState().activeCompanyId;
      if (!company_id) throw new Error('Empresa não selecionada');
      const { data, error } = await supabase
        .from('financial_ledger')
        .insert({ ...entry, company_id, source: entry.source ?? 'manual' })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      qc.invalidateQueries({ queryKey: ['bank_accounts'] });
      toastSuccess('Lançamento registrado');
    },
    onError: handleMutationError,
  });
}
