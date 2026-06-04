import { useQueryClient } from '@tanstack/react-query';
import { chartOfAccountsService } from '@/services/accounting/chartOfAccountsService';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/shared/useSupabaseQuery';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { ChartOfAccount } from '@/types/accounting';

export function useChartOfAccounts() {
  const queryClient = useQueryClient();

  const query = useSupabaseQuery(
    ['chart_of_accounts'], 
    () => chartOfAccountsService.getAll()
  );

  const createAccountMutation = useSupabaseMutation(
    (account: Omit<ChartOfAccount, 'id'>) => chartOfAccountsService.create(account),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chart_of_accounts'] });
        toastSuccess('Conta criada com sucesso');
      },
      onError: (error) => {
        console.error('Error creating account:', error);
        toastError('Erro ao criar conta');
      }
    }
  );

  const deleteAccountMutation = useSupabaseMutation(
    (id: string) => chartOfAccountsService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chart_of_accounts'] });
        toastSuccess('Conta excluída com sucesso');
      },
      onError: (error) => {
        console.error('Error deleting account:', error);
        toastError('Erro ao excluir conta');
      }
    }
  );

  return { 
    accounts: query.data || [], 
    loading: query.isLoading, 
    refetch: query.refetch, 
    createAccount: createAccountMutation.mutate, 
    deleteAccount: deleteAccountMutation.mutate 
  };
}
