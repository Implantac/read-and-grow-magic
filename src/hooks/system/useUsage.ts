import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';

export type UsageMetric = 'orders' | 'nfe' | 'ai_calls' | 'users' | 'branches';

export interface UsageRow {
  metric: UsageMetric | string;
  current_value: number;
  limit_value: number | null;
  period: string;
  usage_percent: number;
  updated_at: string;
}

export const METRIC_LABELS: Record<string, string> = {
  orders: 'Pedidos',
  nfe: 'NF-e emitidas',
  ai_calls: 'Chamadas de IA',
  users: 'Usuários',
  branches: 'Filiais',
};

/** Consumo do mês corrente para a empresa ativa. */
export function useCurrentUsage() {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  return useQuery({
    queryKey: ['usage', 'current', companyId],
    enabled: !!companyId,
    staleTime: 60_000,
    queryFn: async (): Promise<UsageRow[]> => {
      const { data, error } = await (supabase as any)
        .from('v_current_usage')
        .select('*')
        .eq('company_id', companyId);
      if (error) throw error;
      return (data ?? []) as UsageRow[];
    },
  });
}

/** Consulta pontual de quota via RPC (sem incrementar). */
export async function checkQuota(
  companyId: string,
  metric: UsageMetric,
): Promise<{ allowed: boolean; current: number; limit: number | null; remaining: number | null }> {
  const { data, error } = await supabase.rpc('check_quota' as any, {
    _company_id: companyId,
    _metric: metric,
  });
  if (error) throw error;
  const q = (data ?? {}) as any;
  return {
    allowed: !!q.allowed,
    current: q.current ?? 0,
    limit: q.limit ?? null,
    remaining: q.remaining ?? null,
  };
}
