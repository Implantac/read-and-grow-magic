import { useSupabaseQuery } from '@/hooks/shared/useSupabaseQuery';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesService } from '@/services/system/companiesService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { Company } from '@/types/administration';
import { errorMessage } from '@/lib/errors';

export function useCompanies() {
  const queryClient = useQueryClient();
  const query = useSupabaseQuery(['companies'], () => companiesService.getAll());

  const createCompanyMutation = useMutation({
    mutationFn: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => companiesService.create(company),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toastSuccess('Empresa cadastrada com sucesso');
    },
    onError: (error: unknown) => {
      toastError(errorMessage(error, 'Erro ao cadastrar empresa'));
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, company }: { id: string; company: Partial<Company> }) => companiesService.update(id, company),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toastSuccess('Empresa atualizada com sucesso');
    },
    onError: (error: unknown) => {
      toastError(errorMessage(error, 'Erro ao atualizar empresa'));
    }
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => companiesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toastSuccess('Empresa excluída com sucesso');
    },
    onError: (error: unknown) => {
      toastError(errorMessage(error, 'Erro ao excluir empresa'));
    }
  });

  return { 
    companies: (query.data || []) as Company[], 
    loading: query.isLoading, 
    refetch: query.refetch,
    createCompany: createCompanyMutation.mutateAsync,
    updateCompany: updateCompanyMutation.mutateAsync,
    deleteCompany: deleteCompanyMutation.mutateAsync,
    isCreating: createCompanyMutation.isPending,
    isUpdating: updateCompanyMutation.isPending,
    isDeleting: deleteCompanyMutation.isPending,
  };
}
