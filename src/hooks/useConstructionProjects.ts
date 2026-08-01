import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/errors';

export interface ConstructionProject {
  id: string;
  company_id: string;
  code: string;
  name: string;
  client_id: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_total: number;
  status: 'planning' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  progress_percent: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useConstructionProjects() {
  return useQuery({
    queryKey: ['construction_projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('construction_projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ConstructionProject[];
    },
  });
}

export function useCreateConstructionProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<'construction_projects'>) => {
      const { data, error } = await supabase
        .from('construction_projects')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['construction_projects'] });
      toast.success('Obra criada com sucesso');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Erro ao criar obra')),
  });
}

export function useUpdateConstructionProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: TablesUpdate<'construction_projects'> & { id: string }) => {
      const { error } = await supabase
        .from('construction_projects').update(patch)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['construction_projects'] });
      toast.success('Obra atualizada');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Erro ao atualizar')),
  });
}

export function useDeleteConstructionProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('construction_projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['construction_projects'] });
      toast.success('Obra removida');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Erro ao remover')),
  });
}
