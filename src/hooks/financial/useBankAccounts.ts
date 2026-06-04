import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toastError, toastSuccess } from '@/lib/toastHelpers';

export interface BankAccountRow {
  id: string;
  name: string;
  bank_name: string;
  bank_code: string | null;
  agency: string | null;
  account_number: string | null;
  account_type: string;
  balance: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBankAccounts() {
  return useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as BankAccountRow[];
    },
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (account: { name: string; bank_name: string; bank_code?: string; agency?: string; account_number?: string; account_type?: string }) => {
      const { data, error } = await supabase.from('bank_accounts').insert([account]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank_accounts'] }); toastSuccess('Sucesso', 'Conta bancária cadastrada'); },
    onError: () => toastError('Erro ao cadastrar conta'),
  });
}

export function useUpdateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<BankAccountRow>) => {
      const { data, error } = await supabase.from('bank_accounts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank_accounts'] }); },
    onError: () => toastError('Erro ao atualizar conta'),
  });
}
