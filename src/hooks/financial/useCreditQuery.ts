import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditService } from '@/services/financial/creditService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function useCredit() {
  const queryClient = useQueryClient();

  const analysesQuery = useQuery({
    queryKey: ['credit_analyses'],
    queryFn: () => creditService.getCreditAnalyses(),
  });

  const blocksQuery = useQuery({
    queryKey: ['order_blocks'],
    queryFn: () => creditService.getOrderBlocks(),
  });

  const updateAnalysisMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => creditService.updateAnalysis(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit_analyses'] });
      toastSuccess('Análise de crédito atualizada');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao atualizar análise');
    }
  });

  return {
    analyses: analysesQuery.data || [],
    analysesLoading: analysesQuery.isLoading,
    blocks: blocksQuery.data || [],
    blocksLoading: blocksQuery.isLoading,
    
    updateAnalysis: updateAnalysisMutation.mutateAsync,
  };
}
