import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '@/services/accounting/accountingService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { ChartOfAccount, JournalEntry } from '@/types/accounting';

export function useAccounting() {
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: ['chart_of_accounts'],
    queryFn: () => accountingService.getChartOfAccounts(),
  });

  const journalEntriesQuery = useQuery({
    queryKey: ['journal_entries'],
    queryFn: () => accountingService.getJournalEntries(),
  });

  const balanceSheetQuery = useQuery({
    queryKey: ['balance_sheet'],
    queryFn: () => accountingService.getBalanceSheet(),
  });

  const dreQuery = useQuery({
    queryKey: ['dre_report'],
    queryFn: () => accountingService.getDRE(),
  });

  const createAccountMutation = useMutation({
    mutationFn: (account: Omit<ChartOfAccount, 'id'>) => accountingService.createAccount(account),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart_of_accounts'] });
      toastSuccess('Conta contábil criada com sucesso');
    },
    onError: (error: any) => {
      console.error('Error creating account:', error);
      toastError('Erro ao criar conta contábil');
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => accountingService.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart_of_accounts'] });
      toastSuccess('Conta contábil excluída com sucesso');
    },
    onError: (error: any) => {
      console.error('Error deleting account:', error);
      toastError('Erro ao excluir conta contábil');
    }
  });

  const postEntryMutation = useMutation({
    mutationFn: (id: string) => accountingService.postJournalEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
      toastSuccess('Lançamento postado com sucesso');
    },
    onError: (error: any) => {
      console.error('Error posting entry:', error);
      toastError('Erro ao postar lançamento');
    }
  });

  return {
    accounts: accountsQuery.data || [],
    accountsLoading: accountsQuery.isLoading,
    journalEntries: journalEntriesQuery.data || [],
    journalEntriesLoading: journalEntriesQuery.isLoading,
    balanceSheet: balanceSheetQuery.data || [],
    balanceSheetLoading: balanceSheetQuery.isLoading,
    dre: dreQuery.data || [],
    dreLoading: dreQuery.isLoading,
    createAccount: createAccountMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    postEntry: postEntryMutation.mutate,
  };
}
