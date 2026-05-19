import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { data, error } = await supabase
        .from('system_parameters')
        .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
        .eq('key', key)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_parameters'] });
      toast({ title: 'Configuração atualizada com sucesso!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao atualizar configuração', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const getParameter = (key: string, defaultValue: any = null) => {
    const param = parametersQuery.data?.find(p => p.key === key);
    if (!param) return defaultValue;
    try {
      // Supabase returns jsonb which might already be parsed or stringified
      return typeof param.value === 'string' ? JSON.parse(param.value) : param.value;
    } catch (e) {
      return param.value;
    }
  };

  return {
    parameters: parametersQuery.data || [],
    isLoading: parametersQuery.isLoading,
    getParameter,
    updateParameter: updateParameterMutation.mutateAsync,
    isUpdating: updateParameterMutation.isPending
  };
}
