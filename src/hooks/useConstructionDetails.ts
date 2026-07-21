import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BudgetItem {
  id: string;
  company_id: string;
  project_id: string;
  description: string;
  unit: string;
  quantity: number;
  unit_cost: number;
  total: number;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface Measurement {
  id: string;
  company_id: string;
  project_id: string;
  reference_month: string;
  executed_percent: number;
  amount: number;
  status: 'draft' | 'approved' | 'invoiced' | 'paid' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiaryEntry {
  id: string;
  company_id: string;
  project_id: string;
  entry_date: string;
  weather: string | null;
  workforce_count: number | null;
  activities: string | null;
  incidents: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ----- Budget -----
export function useBudgetItems(projectId: string) {
  return useQuery({
    queryKey: ['construction_budget_items', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('construction_budget_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as BudgetItem[];
    },
  });
}

export function useCreateBudgetItem(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from('construction_budget_items')
        .insert({ ...payload, project_id: projectId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['construction_budget_items', projectId] });
      toast.success('Item de orçamento adicionado');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao adicionar item'),
  });
}

export function useDeleteBudgetItem(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('construction_budget_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['construction_budget_items', projectId] }),
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao remover item'),
  });
}

// ----- Measurements -----
export function useMeasurements(projectId: string) {
  return useQuery({
    queryKey: ['construction_measurements', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('construction_measurements')
        .select('*')
        .eq('project_id', projectId)
        .order('reference_month', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Measurement[];
    },
  });
}

export function useCreateMeasurement(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from('construction_measurements')
        .insert({ ...payload, project_id: projectId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['construction_measurements', projectId] });
      toast.success('Medição registrada');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao registrar medição'),
  });
}

export function useUpdateMeasurement(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: any & { id: string }) => {
      const { error } = await supabase
        .from('construction_measurements')
        .update(patch as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['construction_measurements', projectId] }),
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao atualizar'),
  });
}

// ----- Diary -----
export function useDiary(projectId: string) {
  return useQuery({
    queryKey: ['construction_diary', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('construction_diary')
        .select('*')
        .eq('project_id', projectId)
        .order('entry_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as DiaryEntry[];
    },
  });
}

export function useCreateDiaryEntry(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from('construction_diary')
        .insert({ ...payload, project_id: projectId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['construction_diary', projectId] });
      toast.success('Apontamento registrado');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Erro ao registrar apontamento'),
  });
}
