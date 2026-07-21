import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { toastSuccess, handleMutationError } from '@/lib/toastHelpers';

export interface AgroFarm {
  id: string;
  company_id: string;
  code: string;
  name: string;
  location: string | null;
  total_area_ha: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgroField {
  id: string;
  company_id: string;
  farm_id: string;
  code: string;
  name: string;
  area_ha: number;
  soil_type: string | null;
  current_crop: string | null;
  status: string;
  notes: string | null;
}

export interface AgroSeason {
  id: string;
  company_id: string;
  field_id: string;
  crop: string;
  variety: string | null;
  planting_date: string | null;
  expected_harvest_date: string | null;
  estimated_yield_per_ha: number | null;
  estimated_cost: number;
  status: string;
  notes: string | null;
}

export interface AgroHarvest {
  id: string;
  company_id: string;
  season_id: string;
  harvest_date: string;
  quantity: number;
  unit: string;
  quality_grade: string | null;
  revenue: number;
  notes: string | null;
}

export function useAgroFarms() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['agro_farms', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agro_farms' as any)
        .select('*')
        .order('code');
      if (error) throw error;
      return (data || []) as unknown as AgroFarm[];
    },
  });
}

export function useCreateAgroFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data, error } = await supabase
        .from('agro_farms' as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agro_farms'] });
      toastSuccess('Fazenda cadastrada');
    },
    onError: handleMutationError,
  });
}

export function useDeleteAgroFarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('agro_farms' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agro_farms'] });
      toastSuccess('Fazenda removida');
    },
    onError: handleMutationError,
  });
}

export function useAgroFields(farmId?: string) {
  return useQuery({
    queryKey: ['agro_fields', farmId],
    enabled: !!farmId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agro_fields' as any)
        .select('*')
        .eq('farm_id', farmId!)
        .order('code');
      if (error) throw error;
      return (data || []) as unknown as AgroField[];
    },
  });
}

export function useCreateAgroField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data, error } = await supabase
        .from('agro_fields' as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars: any) => {
      qc.invalidateQueries({ queryKey: ['agro_fields', vars.farm_id] });
      toastSuccess('Talhão cadastrado');
    },
    onError: handleMutationError,
  });
}

export function useAgroSeasons(fieldId?: string) {
  return useQuery({
    queryKey: ['agro_seasons', fieldId],
    enabled: !!fieldId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agro_seasons' as any)
        .select('*')
        .eq('field_id', fieldId!)
        .order('planting_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AgroSeason[];
    },
  });
}

export function useCreateAgroSeason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data, error } = await supabase
        .from('agro_seasons' as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars: any) => {
      qc.invalidateQueries({ queryKey: ['agro_seasons', vars.field_id] });
      toastSuccess('Safra criada');
    },
    onError: handleMutationError,
  });
}

export function useAgroHarvests(seasonId?: string) {
  return useQuery({
    queryKey: ['agro_harvests', seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agro_harvests' as any)
        .select('*')
        .eq('season_id', seasonId!)
        .order('harvest_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AgroHarvest[];
    },
  });
}

export function useCreateAgroHarvest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => {
      const { data, error } = await supabase
        .from('agro_harvests' as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars: any) => {
      qc.invalidateQueries({ queryKey: ['agro_harvests', vars.season_id] });
      toastSuccess('Colheita registrada');
    },
    onError: handleMutationError,
  });
}
