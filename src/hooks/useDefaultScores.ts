import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface DefaultScoreRow {
  id: string;
  client_id: string;
  client_name: string | null;
  overdue_count: number;
  overdue_amount: number;
  avg_delay_days: number;
  max_delay_days: number;
  total_billed: number;
  total_paid_on_time: number;
  score_numeric: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  last_payment_date: string | null;
  computed_at: string;
}

export const RISK_LABELS: Record<DefaultScoreRow['risk_level'], string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
  critical: 'Crítico',
};

export const RISK_COLORS: Record<DefaultScoreRow['risk_level'], string> = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

export function useDefaultScores(filters?: { riskLevel?: string }) {
  return useQuery({
    queryKey: ['financial_default_score', filters],
    queryFn: async () => {
      let q = supabase
        .from('financial_default_score')
        .select('*')
        .order('score_numeric', { ascending: false });
      if (filters?.riskLevel) q = q.eq('risk_level', filters.riskLevel);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return data as DefaultScoreRow[];
    },
  });
}

export function useRecomputeDefaultScores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('recompute_default_scores');
      if (error) throw error;
      return data as { ok: boolean; clients_scored: number };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['financial_default_score'] });
      toastSuccess('Scores recalculados', `${data.clients_scored} clientes`);
    },
    onError: handleMutationError,
  });
}
