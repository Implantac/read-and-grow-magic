import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export interface TaxRule {
  id: string;
  name: string;
  description: string | null;
  ncm: string | null;
  cfop: string | null;
  uf_origin: string | null;
  uf_destination: string | null;
  operation_type: string;
  tax_regime: string;
  icms_cst: string;
  icms_rate: number;
  icms_reduction_base: number;
  icms_st_rate: number;
  icms_st_mva: number;
  pis_cst: string;
  pis_rate: number;
  cofins_cst: string;
  cofins_rate: number;
  ipi_cst: string;
  ipi_rate: number;
  priority: number;
  active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  notes: string | null;
  tax_framework: 'current' | 'reform_ibs_cbs' | 'hybrid';
  ibs_rate: number;
  cbs_rate: number;
  is_is_rate: number;
  created_at: string;
  updated_at: string;
}

export function useTaxRules() {
  return useQuery({
    queryKey: ['tax_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_rules' as any)
        .select('*')
        .order('priority', { ascending: false })
        .order('name');
      if (error) throw error;
      return (data as any as TaxRule[]) ?? [];
    },
  });
}

export function useUpsertTaxRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<TaxRule> & { name: string }) => {
      const { id, created_at, updated_at, ...payload } = rule as any;
      if (id) {
        const { data, error } = await supabase
          .from('tax_rules' as any)
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('tax_rules' as any)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tax_rules'] });
      toastSuccess('Regra fiscal salva');
    },
    onError: (e: any) =>
      toastError(e.message),
  });
}

export function useDeleteTaxRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tax_rules' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tax_rules'] });
      toastSuccess('Regra removida');
    },
    onError: (e: any) =>
      toastError(e.message),
  });
}

export interface TaxCalculation {
  rule_id: string | null;
  rule_name?: string;
  icms_base: number;
  icms_rate: number;
  icms_value: number;
  pis_rate: number;
  pis_value: number;
  cofins_rate: number;
  cofins_value: number;
  ipi_rate: number;
  ipi_value: number;
  total: number;
}

export async function calculateItemTaxes(args: {
  ncm?: string | null;
  cfop?: string | null;
  quantity: number;
  unit_price: number;
  discount?: number;
}): Promise<TaxCalculation> {
  const { data, error } = await supabase.rpc('calculate_nfe_item_taxes' as any, {
    _ncm: args.ncm ?? null,
    _cfop: args.cfop ?? null,
    _quantity: args.quantity,
    _unit_price: args.unit_price,
    _discount: args.discount ?? 0,
  });
  if (error) throw error;
  return data as TaxCalculation;
}
