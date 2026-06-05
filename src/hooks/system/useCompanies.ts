import { useAppStore } from '@/stores/useAppStore';
import { useSupabaseQuery } from '@/hooks/shared/useSupabaseQuery';
import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesService } from '@/services/system/companiesService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { Company } from '@/types/administration';

export function useCompanies() {
  const queryClient = useQueryClient();
  const { setCompanies, activeCompany, setActiveCompany } = useAppStore();
  const query = useSupabaseQuery(['companies'], () => companiesService.getAll());

  useEffect(() => {
    if (query.data && query.data.length > 0) {
      setCompanies(query.data as any);
      if (!activeCompany) {
        setActiveCompany(query.data[0] as any);
      }
    }
  }, [query.data, setCompanies, activeCompany, setActiveCompany]);

  const createCompanyMutation = useMutation({
    mutationFn: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => companiesService.create(company),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toastSuccess('Empresa cadastrada com sucesso');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao cadastrar empresa');
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, company }: { id: string; company: Partial<Company> }) => companiesService.update(id, company),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toastSuccess('Empresa atualizada com sucesso');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao atualizar empresa');
    }
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => companiesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toastSuccess('Empresa excluída com sucesso');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao excluir empresa');
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
