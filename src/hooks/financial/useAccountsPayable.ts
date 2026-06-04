import { useQueryClient } from '@tanstack/react-query';
import { financialService } from '@/services/financial/financialService';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/shared/useSupabaseQuery';
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
  return useSupabaseQuery(['accounts_payable'], () => financialService.getPayables());
}

export function useCreateAccountPayable() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    (account: Partial<AccountPayableRow> & { description: string; supplier: string; due_date: string; amount: number }) => 
      financialService.createPayable(account),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['accounts_payable'] });
        toastSuccess('Sucesso', 'Conta a pagar cadastrada com sucesso');
      },
      onError: () => toastError('Erro ao cadastrar conta a pagar'),
    }
  );
}

export function useUpdateAccountPayable() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    ({ id, ...updates }: { id: string } & Partial<AccountPayableRow>) => 
      financialService.updatePayable(id, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['accounts_payable'] });
      },
      onError: () => toastError('Erro ao atualizar conta'),
    }
  );
}

export function useDeleteAccountPayable() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    (id: string) => financialService.deletePayable(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['accounts_payable'] });
        toastSuccess('Sucesso', 'Conta removida com sucesso');
      },
      onError: () => toastError('Erro ao remover conta'),
    }
  );
}
