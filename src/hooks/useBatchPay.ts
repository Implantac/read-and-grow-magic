import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export function useBatchPayPayables() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { ids: string[]; bank_account_id: string; payment_method: string; payment_date?: string; notes?: string }) => {
      const { data, error } = await supabase.rpc('batch_pay_payables' as any, {
        _payable_ids: params.ids,
        _bank_account_id: params.bank_account_id,
        _payment_method: params.payment_method,
        _payment_date: params.payment_date ?? new Date().toISOString().split('T')[0],
        _notes: params.notes ?? null,
      });
      if (error) throw error;
      return data as { ok: boolean; paid_count: number; total: number };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['accounts_payable'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      qc.invalidateQueries({ queryKey: ['bank_accounts'] });
      qc.invalidateQueries({ queryKey: ['financial_settlements'] });
      toastSuccess('Pagamento em lote concluído', `${data.paid_count} contas pagas`);
    },
    onError: handleMutationError,
  });
}
