import { useQueryClient } from '@tanstack/react-query';
import { journalEntriesService } from '@/services/accounting/journalEntriesService';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/shared/useSupabaseQuery';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function useJournalEntries() {
  const queryClient = useQueryClient();

  const query = useSupabaseQuery(
    ['journal_entries'], 
    () => journalEntriesService.getAll()
  );

  const postEntryMutation = useSupabaseMutation(
    (id: string) => journalEntriesService.postEntry(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
        toastSuccess('Lançamento lançado com sucesso');
      },
      onError: (error) => {
        console.error('Error posting entry:', error);
        toastError('Erro ao lançar');
      }
    }
  );

  return { 
    entries: query.data || [], 
    loading: query.isLoading, 
    refetch: query.refetch, 
    postEntry: postEntryMutation.mutate 
  };
}
