import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export interface AccountPayableRow {
  id: string;
  description: string;
  supplier: string;
  category: string;
  amount: number;
  original_amount: number | null;
  open_amount: number | null;
  paid_amount: number | null;
  interest: number | null;
  penalty: number | null;
  discount_amount: number | null;
  due_date: string;
  payment_date: string | null;
  status: string;
  payment_method: string | null;
  notes: string | null;
  invoice_number: string | null;
  expense_type: string | null;
  cost_center_id: string | null;
  bank_account_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
  created_at: string;
  updated_at: string;
}

export function useAccountsPayable() {
  return useQuery({
    queryKey: ['accounts_payable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*')
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as AccountPayableRow[];
    },
  });
}

export function useCreateAccountPayable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (account: Partial<AccountPayableRow> & { description: string; supplier: string; due_date: string; amount: number }) => {
      const { data, error } = await supabase
        .from('accounts_payable')
        .insert(account)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_payable'] });
      toastSuccess('Sucesso', 'Conta a pagar cadastrada com sucesso');
    },
    onError: () => {
      toastError('Erro ao cadastrar conta a pagar');
    },
  });
}

export function useUpdateAccountPayable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<AccountPayableRow>) => {
      const { data, error } = await supabase
        .from('accounts_payable')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_payable'] });
    },
    onError: () => {
      toastError('Erro ao atualizar conta');
    },
  });
}

export function useDeleteAccountPayable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts_payable').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_payable'] });
      toastSuccess('Sucesso', 'Conta removida com sucesso');
    },
    onError: () => {
      toastError('Erro ao remover conta');
    },
  });
}
