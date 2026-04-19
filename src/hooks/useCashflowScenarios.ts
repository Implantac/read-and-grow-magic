import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ScenarioRow {
  day: string;
  inflow_real: number;
  outflow_real: number;
  inflow_optimistic: number;
  outflow_pessimistic: number;
  balance_real: number;
  balance_optimistic: number;
  balance_pessimistic: number;
}

export function useCashflowScenarios(days = 30) {
  return useQuery({
    queryKey: ['cashflow_scenarios', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cashflow_scenarios', { _days: days });
      if (error) throw error;
      return (data ?? []) as ScenarioRow[];
    },
  });
}
