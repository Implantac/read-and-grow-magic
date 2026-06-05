import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parametersService } from '@/services/system/parametersService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function useSystemParameters() {
  const queryClient = useQueryClient();
  
  const parametersQuery = useQuery({
    queryKey: ['system_parameters'],
    queryFn: () => parametersService.getAll(),
  });

  const updateParameterMutation = useMutation({
    mutationFn: ({ code, value }: { code: string; value: string }) => 
      parametersService.update(code, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_parameters'] });
      toastSuccess('Configuração atualizada com sucesso');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao atualizar configuração');
    },
  });

  const getParameter = (code: string, defaultValue: string = '') => {
    const param = parametersQuery.data?.find(p => p.code === code);
    return param?.value ?? defaultValue;
  };

  return {
    parameters: parametersQuery.data || [],
    isLoading: parametersQuery.isLoading,
    getParameter,
    updateParameter: updateParameterMutation.mutateAsync,
    isUpdating: updateParameterMutation.isPending
  };
}
