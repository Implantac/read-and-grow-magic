import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function useSuppliers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const suppliersQuery = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (supplier: any) => {
      const { data, error } = await supabase.from('suppliers').insert(supplier).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toastSuccess('Fornecedor criado com sucesso!');
    },
    onError: (error: any) => {
      toastError(error.message, undefined, 'Erro ao criar fornecedor');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toastSuccess('Fornecedor atualizado com sucesso!');
    },
    onError: (error: any) => {
      toastError(error.message, undefined, 'Erro ao atualizar fornecedor');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toastSuccess('Fornecedor excluído com sucesso!');
    },
    onError: (error: any) => {
      toastError(error.message, undefined, 'Erro ao excluir fornecedor');
    },
  });

  return { 
    suppliers: suppliersQuery.data || [], 
    loading: suppliersQuery.isLoading, 
    refetch: suppliersQuery.refetch, 
    create: (s: any) => createMutation.mutateAsync(s), 
    update: (id: string, u: any) => updateMutation.mutateAsync({ id, updates: u }), 
    remove: (id: string) => deleteMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: deleteMutation.isPending
  };
}
