import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function useSystemParameters() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const parametersQuery = useQuery({
    queryKey: ['system_parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_parameters')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const updateParameterMutation = useMutation({
    mutationFn: async ({ code, value }: { code: string; value: string }) => {
      const { data, error } = await supabase
        .from('system_parameters')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('code', code)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_parameters'] });
      toastSuccess('Configuração atualizada com sucesso!');
    },
    onError: (error: any) => {
      toastError(error.message, undefined, 'Erro ao atualizar configuração');
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
