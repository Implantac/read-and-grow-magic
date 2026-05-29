import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface ICMSSTRule {
  id: string;
  name: string;
  ncm: string | null;
  cest: string | null;
  uf_origin: string | null;
  uf_destination: string | null;
  mva_original: number;
  mva_adjusted: number | null;
  internal_rate: number;
  interstate_rate: number;
  reduction_base: number | null;
  active: boolean;
  priority: number;
  valid_from: string | null;
  valid_until: string | null;
  notes: string | null;
}

export interface DIFALRule {
  id: string;
  name: string;
  uf_origin: string;
  uf_destination: string;
  internal_rate_destination: number;
  interstate_rate: number;
  fcp_rate: number | null;
  partilha_destination: number | null;
  partilha_origin: number | null;
  active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  notes: string | null;
}

export function useICMSSTRules() {
  return useQuery({
    queryKey: ['icms_st_rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tax_icms_st_rules' as any).select('*').order('priority', { ascending: false }).order('name');
      if (error) throw error;
      return (data as any as ICMSSTRule[]) ?? [];
    },
  });
}

export function useUpsertICMSST() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (rule: Partial<ICMSSTRule> & { name: string }) => {
      const { id, ...payload } = rule as any;
      const q = id
        ? supabase.from('tax_icms_st_rules' as any).update(payload).eq('id', id).select().single()
        : supabase.from('tax_icms_st_rules' as any).insert(payload).select().single();
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['icms_st_rules'] });
      toastSuccess('Regra ICMS ST salva');
    },
    onError: handleMutationError,
  });
}

export function useDIFALRules() {
  return useQuery({
    queryKey: ['difal_rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tax_difal_rules' as any).select('*').order('uf_origin').order('uf_destination');
      if (error) throw error;
      return (data as any as DIFALRule[]) ?? [];
    },
  });
}

export function useUpsertDIFAL() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (rule: Partial<DIFALRule> & { name: string; uf_origin: string; uf_destination: string }) => {
      const { id, ...payload } = rule as any;
      const q = id
        ? supabase.from('tax_difal_rules' as any).update(payload).eq('id', id).select().single()
        : supabase.from('tax_difal_rules' as any).insert(payload).select().single();
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['difal_rules'] });
      toastSuccess('Regra DIFAL salva');
    },
    onError: handleMutationError,
  });
}
