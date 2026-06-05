import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface PixCharge {
  id: string;
  external_id: string | null;
  txid: string | null;
  receivable_id: string | null;
  client_id: string | null;
  client_name: string | null;
  amount: number;
  description: string | null;
  qr_code: string | null;
  copy_paste: string | null;
  expires_at: string | null;
  paid_at: string | null;
  payer_name: string | null;
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded';
  bank_account_id: string | null;
  created_at: string;
}

export function usePixCharges() {
  return useQuery({
    queryKey: ['pix_charges'],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('pix_charges').select('*')
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as PixCharge[];
    },
    refetchInterval: 30_000,
  });
}

export function useCreatePixCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { amount: number; client_name?: string; client_id?: string; receivable_id?: string; description?: string; bank_account_id?: string; expires_minutes?: number }) => {
      const { data, error } = await supabase.functions.invoke('pix-webhook?action=create', { body: input });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pix_charges'] });
      toastSuccess('Cobrança PIX gerada');
    },
    onError: handleMutationError,
  });
}

export function useSimulatePixPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (charge_id: string) => {
      const { data, error } = await supabase.functions.invoke('pix-webhook?action=simulate-payment', { body: { charge_id } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pix_charges'] });
      qc.invalidateQueries({ queryKey: ['accounts_receivable'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      qc.invalidateQueries({ queryKey: ['bank_accounts'] });
      toastSuccess('Pagamento PIX simulado com sucesso');
    },
    onError: handleMutationError,
  });
}
