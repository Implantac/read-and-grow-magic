import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fiscalService } from '@/services/fiscal/fiscalService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { NFe } from '@/types/fiscal';

export function useFiscal() {
  const queryClient = useQueryClient();

  const nfesQuery = useQuery({
    queryKey: ['nfes'],
    queryFn: () => fiscalService.getNFes(),
  });

  const taxRulesQuery = useQuery({
    queryKey: ['tax_rules'],
    queryFn: () => fiscalService.getTaxRules(),
  });

  const transmitNFeMutation = useMutation({
    mutationFn: (id: string) => fiscalService.transmitNFe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfes'] });
      toastSuccess('NF-e autorizada com sucesso');
    },
    onError: (error: any) => {
      console.error('Error transmitting NFe:', error);
      toastError('Erro ao transmitir NF-e');
    }
  });

  const cancelNFeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => fiscalService.cancelNFe(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfes'] });
      toastSuccess('NF-e cancelada com sucesso');
    },
    onError: (error: any) => {
      console.error('Error cancelling NFe:', error);
      toastError('Erro ao cancelar NF-e');
    }
  });

  return {
    nfes: nfesQuery.data || [],
    nfesLoading: nfesQuery.isLoading,
    taxRules: taxRulesQuery.data || [],
    taxRulesLoading: taxRulesQuery.isLoading,
    transmitNFe: transmitNFeMutation.mutate,
    cancelNFe: cancelNFeMutation.mutate,
  };
}
