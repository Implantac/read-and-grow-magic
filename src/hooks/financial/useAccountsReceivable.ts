import { useQueryClient } from '@tanstack/react-query';
import { financialService } from '@/services/financial/financialService';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/shared/useSupabaseQuery';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export interface AccountReceivableRow {
  id: string;
  description: string;
  client_name: string;
  client_id: string | null;
  category: string;
  amount: number;
  original_amount: number | null;
  open_amount: number | null;
  paid_amount: number | null;
  interest: number | null;
  penalty: number | null;
  discount_amount: number | null;
  due_date: string;
  issue_date: string | null;
  payment_date: string | null;
  status: string;
  payment_method: string | null;
  notes: string | null;
  invoice_number: string | null;
  nfe_id: string | null;
  order_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
  created_at: string;
  updated_at: string;
}

export function useAccountsReceivable() {
  return useSupabaseQuery(['accounts_receivable'], () => financialService.getReceivables());
}

export function useCreateAccountReceivable() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    (account: Partial<AccountReceivableRow> & { description: string; client_name: string; due_date: string; amount: number }) => 
      financialService.createReceivable(account),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] });
        toastSuccess('Sucesso', 'Conta a receber cadastrada com sucesso');
      },
      onError: () => toastError('Erro ao cadastrar conta a receber'),
    }
  );
}

export function useUpdateAccountReceivable() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    ({ id, ...updates }: { id: string } & Partial<AccountReceivableRow>) => 
      financialService.updateReceivable(id, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] });
      },
      onError: () => toastError('Erro ao atualizar conta'),
    }
  );
}

export function useDeleteAccountReceivable() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    (id: string) => financialService.deleteReceivable(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] });
        toastSuccess('Sucesso', 'Conta removida com sucesso');
      },
      onError: () => toastError('Erro ao remover conta'),
    }
  );
}
