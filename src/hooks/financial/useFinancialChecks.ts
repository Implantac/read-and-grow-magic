import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CheckStatus } from '@/types/financial';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface FinancialCheck {
  id: string;
  check_type: 'received' | 'issued';
  check_number: string;
  bank_code: string | null;
  bank_name: string | null;
  agency: string | null;
  account: string | null;
  issuer_name: string | null;
  issuer_document: string | null;
  amount: number;
  issue_date: string;
  due_date: string | null;
  deposit_date: string | null;
  clear_date: string | null;
  status: CheckStatus;
  receivable_id: string | null;
  payable_id: string | null;
  bank_account_id: string | null;
  settlement_id: string | null;
  ledger_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useFinancialChecks(filters?: { status?: string; type?: string }) {
  return useQuery({
    queryKey: ['financial_checks', filters],
    queryFn: async () => {
      let q = supabase.from('financial_checks' as any).select('*').order('due_date', { ascending: true });
      if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status);
      if (filters?.type && filters.type !== 'all') q = q.eq('check_type', filters.type);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as FinancialCheck[];
    },
  });
}

export function useCreateCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<FinancialCheck> & { check_type: 'received' | 'issued'; check_number: string; amount: number }) => {
      const { data, error } = await supabase.from('financial_checks' as any).insert(input as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_checks'] });
      toastSuccess('Cheque registrado');
    },
    onError: handleMutationError,
  });
}

export function useUpdateCheckStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, deposit_date }: { id: string; status: CheckStatus; deposit_date?: string }) => {
      const updates: any = { status };
      if (deposit_date) updates.deposit_date = deposit_date;
      const { data, error } = await supabase.from('financial_checks' as any).update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_checks'] });
      toastSuccess('Status atualizado');
    },
    onError: handleMutationError,
  });
}

export function useCompensateCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; bank_account_id?: string; clear_date?: string }) => {
      const { data, error } = await supabase.rpc('compensate_check' as any, {
        _check_id: params.id,
        _bank_account_id: params.bank_account_id ?? null,
        _clear_date: params.clear_date ?? new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_checks'] });
      qc.invalidateQueries({ queryKey: ['accounts_receivable'] });
      qc.invalidateQueries({ queryKey: ['accounts_payable'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      qc.invalidateQueries({ queryKey: ['bank_accounts'] });
      qc.invalidateQueries({ queryKey: ['financial_settlements'] });
      toastSuccess('Cheque compensado', 'Lançamento gerado no caixa');
    },
    onError: handleMutationError,
  });
}

export function useDeleteCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_checks' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_checks'] });
      toastSuccess('Cheque removido');
    },
    onError: handleMutationError,
  });
}
