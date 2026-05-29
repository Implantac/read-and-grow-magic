import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mutationErrorHandler, toastSuccess } from '@/lib/toastHelpers';

export interface DbSalesRep {
  id: string;
  user_id: string | null;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  region: string | null;
  micro_region: string | null;
  commission_rate: number;
  status: string;
  monthly_target: number;
  total_sales: number;
  created_at: string;
  updated_at: string;
}

export function useSalesReps() {
  return useQuery({
    queryKey: ['sales_reps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_reps')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as DbSalesRep[];
    },
  });
}

export function useCreateSalesRep() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (rep: Partial<DbSalesRep>) => {
      const { data, error } = await supabase.from('sales_reps').insert(rep as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales_reps'] });
      toastSuccess('Representante criado com sucesso');
    },
    onError: mutationErrorHandler('Erro ao criar representante'),
  });
}

export function useUpdateSalesRep() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbSalesRep> & { id: string }) => {
      const { data, error } = await supabase.from('sales_reps').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales_reps'] });
      toastSuccess('Representante atualizado');
    },
    onError: mutationErrorHandler('Erro ao atualizar'),
  });
}

export function useDeleteSalesRep() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales_reps').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales_reps'] });
      toastSuccess('Representante removido');
    },
    onError: mutationErrorHandler('Erro ao remover'),
  });
}
