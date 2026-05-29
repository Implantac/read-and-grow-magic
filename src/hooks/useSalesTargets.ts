import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mutationErrorHandler } from '@/lib/toastHelpers';

export function useSalesTargets(filters?: { period?: string; entityType?: string }) {
  return useQuery({
    queryKey: ['sales-targets', filters],
    queryFn: async () => {
      let query = supabase.from('sales_targets').select('*').order('created_at', { ascending: false });
      if (filters?.period) query = query.eq('period', filters.period);
      if (filters?.entityType) query = query.eq('entity_type', filters.entityType);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useSalesTargetMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTarget = useMutation({
    mutationFn: async (target: any) => {
      const { data, error } = await supabase.from('sales_targets').insert(target).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-targets'] });
      toast({ title: 'Meta criada com sucesso' });
    },
    onError: mutationErrorHandler('Erro ao criar meta'),
  });

  const updateTarget = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('sales_targets').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-targets'] });
      toast({ title: 'Meta atualizada' });
    },
  });

  const deleteTarget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales_targets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-targets'] });
      toast({ title: 'Meta removida' });
    },
  });

  return { createTarget, updateTarget, deleteTarget };
}
