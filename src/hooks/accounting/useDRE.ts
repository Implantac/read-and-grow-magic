import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery({
    queryKey: ['dre_summary', from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dre_summary' as any, {
        _from: from,
        _to: to,
      });
      if (error) throw error;
      return (data || []) as DRESummaryRow[];
    },
  });
}

export function useDREDetailed(from: string, to: string) {
  return useQuery({
    queryKey: ['dre_detailed', from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dre' as any, {
        _from: from,
        _to: to,
      });
      if (error) throw error;
      return (data || []) as DRECategoryRow[];
    },
  });
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
