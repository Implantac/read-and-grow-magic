import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface FinancialAdvanceRow {
  id: string;
  party_type: 'client' | 'supplier';
  client_id: string | null;
  supplier_id: string | null;
  party_name: string;
  amount: number;
  used_amount: number;
  remaining_amount: number;
  bank_account_id: string | null;
  payment_method: string | null;
  received_date: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export function useFinancialAdvances(partyType?: 'client' | 'supplier') {
  return useQuery({
    queryKey: ['financial_advances', partyType],
    queryFn: async () => {
      let q = (supabase.from as any)('financial_advances').select('*').order('received_date', { ascending: false });
      if (partyType) q = q.eq('party_type', partyType);
      const { data, error } = await q;
      if (error) throw error;
      return data as FinancialAdvanceRow[];
    },
  });
}

export function useCreateAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (adv: Omit<FinancialAdvanceRow, 'id' | 'created_at' | 'used_amount' | 'remaining_amount' | 'status'>) => {
      const { data, error } = await (supabase.from as any)('financial_advances').insert(adv).select().single();
      if (error) throw error;
      // Lança no ledger
      if (data && adv.bank_account_id) {
        await (supabase.from as any)('financial_ledger').insert({
          entry_date: adv.received_date,
          type: adv.party_type === 'client' ? 'inflow' : 'outflow',
          amount: adv.amount,
          description: `Adiantamento — ${adv.party_name}`,
          bank_account_id: adv.bank_account_id,
          source: 'advance',
          source_id: data.id,
          payment_method: adv.payment_method,
        });
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_advances'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      qc.invalidateQueries({ queryKey: ['bank_accounts'] });
      toastSuccess('Adiantamento registrado');
    },
    onError: handleMutationError,
  });
}
