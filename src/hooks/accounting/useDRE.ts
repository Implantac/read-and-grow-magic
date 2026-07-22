import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { dreService } from '@/services/accounting/dreService';
import { useSupabaseQuery } from '@/hooks/shared/useSupabaseQuery';

async function getCompanyId(): Promise<string> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error('Não autenticado');
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle();
  if (!profile?.company_id) throw new Error('Empresa não encontrada');
  return profile.company_id;
}

export type DRESection =
  | 'revenue'
  | 'other_revenue'
  | 'cost'
  | 'operating_expense'
  | 'tax'
  | 'financial_expense'
  | 'financial_revenue'
  | 'other_expense';

export interface DRESummaryRow {
  section: DRESection;
  total: number;
}

export interface DRECategoryRow {
  section: DRESection;
  category_id: string | null;
  category_name: string;
  total: number;
}

export interface DRECalculation {
  revenue: number;
  otherRevenue: number;
  cost: number;
  grossProfit: number;
  operatingExpense: number;
  tax: number;
  operatingResult: number;
  financialResult: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
}

export function useDRESummary(from: string, to: string) {
  return useSupabaseQuery(['dre_summary', from, to], () => dreService.getSummary(from, to));
}

export function useDREDetailed(from: string, to: string) {
  return useSupabaseQuery(['dre_detailed', from, to], () => dreService.getDetailed(from, to));
}

export interface DREDynamicRow {
  section: string;
  category_id: string | null;
  category_name: string;
  total: number;
}

export function useDREDynamic(params: { from: string; to: string; costCenterId?: string | null; channel?: string | null }) {
  return useSupabaseQuery(['dre_dynamic', params], () => dreService.getDynamic(params));
}

export function calculateDRE(rows: DRESummaryRow[]): DRECalculation {
  const get = (s: DRESection) => Number(rows.find((r) => r.section === s)?.total ?? 0);
  const revenue = get('revenue');
  const otherRevenue = get('other_revenue');
  // expenses arrive as negative (signed). Convert to positive magnitudes.
  const cost = Math.abs(get('cost'));
  const operatingExpense = Math.abs(get('operating_expense'));
  const tax = Math.abs(get('tax'));
  const financialExpense = Math.abs(get('financial_expense'));
  const financialRevenue = get('financial_revenue');
  const otherExpense = Math.abs(get('other_expense'));

  const grossRevenue = revenue + otherRevenue;
  const grossProfit = grossRevenue - cost - tax;
  const operatingResult = grossProfit - operatingExpense;
  const financialResult = financialRevenue - financialExpense;
  const netProfit = operatingResult + financialResult - otherExpense;

  return {
    revenue: grossRevenue,
    otherRevenue,
    cost,
    grossProfit,
    operatingExpense,
    tax,
    operatingResult,
    financialResult,
    netProfit,
    grossMargin: grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0,
    netMargin: grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0,
  };
}

// ===== Managerial DRE (RPC-based, with cost centers) =====

export interface DREManagerialRow {
  cost_center_id: string | null;
  cost_center_code: string;
  cost_center_name: string;
  dre_section: string;
  category_id: string | null;
  category_name: string;
  category_type: string;
  total_amount: number;
  entry_count: number;
}

export interface DREEntry {
  id: string;
  entry_date: string;
  description: string | null;
  type: string;
  amount: number;
  category_name: string;
  cost_center_name: string;
  source: string | null;
  reference: string | null;
}

export function useDREManagerial(from: string, to: string) {
  return useQuery({
    queryKey: ['dre-managerial', from, to],
    queryFn: async (): Promise<DREManagerialRow[]> => {
      const companyId = await getCompanyId();
      const { data, error } = await supabase.rpc('dre_managerial', {
        p_company_id: companyId,
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      return (data ?? []) as DREManagerialRow[];
    },
    staleTime: 60_000,
  });
}

export function useDREManagerialEntries(
  from: string,
  to: string,
  costCenterId: string | null,
  categoryId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ['dre-managerial-entries', from, to, costCenterId, categoryId],
    enabled,
    queryFn: async (): Promise<DREEntry[]> => {
      const companyId = await getCompanyId();
      const { data, error } = await supabase.rpc('dre_managerial_entries', {
        p_company_id: companyId,
        p_from: from,
        p_to: to,
        p_cost_center_id: costCenterId,
        p_category_id: categoryId,
      });
      if (error) throw error;
      return (data ?? []) as DREEntry[];
    },
  });
}
