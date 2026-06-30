import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UsageMetric {
  metric: string;
  current_value: number;
  limit_value: number;
  percent: number;
  period: string;
}

const METRIC_LABELS: Record<string, string> = {
  users: 'Usuários',
  orders_month: 'Pedidos no mês',
  nfe_month: 'NF-e no mês',
  ai_calls_month: 'Chamadas IA',
  branches: 'Filiais',
};

export function labelForMetric(key: string): string {
  return METRIC_LABELS[key] ?? key;
}

/**
 * Usage summary do tenant atual, com refetch a cada 60s.
 * Lê via RPC `get_usage_summary` (RLS by auth.uid).
 */
export function useUsageSummary() {
  return useQuery({
    queryKey: ['usage_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_usage_summary');
      if (error) throw error;
      return (data ?? []) as UsageMetric[];
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
