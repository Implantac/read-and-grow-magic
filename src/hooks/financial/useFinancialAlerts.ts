import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface FinancialAlertRow {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  status: string;
  resolved_at: string | null;
  resolved_by?: string | null;
  metric_name?: string | null;
  metric_value?: number | null;
  threshold_value?: number | null;
  reference_date?: string | null;
  payload?: any;
  created_at: string;
}

export function useFinancialAlerts(status: 'open' | 'all' = 'all') {
  return useQuery({
    queryKey: ['financial_alerts', status],
    queryFn: async () => {
      let q = supabase
        .from('financial_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (status === 'open') q = q.eq('status', 'open');
      const { data, error } = await q;
      if (error) throw error;
      return data as FinancialAlertRow[];
    },
  });
}

export function useDetectFinancialAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('detect_financial_alerts');
      if (error) throw error;
      return data as { ok: boolean; created: number };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['financial_alerts'] });
      toastSuccess('Análise concluída', `${data.created} alertas avaliados`);
    },
    onError: handleMutationError,
  });
}

export function useUpdateAlertStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'acknowledged' | 'resolved' }) => {
      const patch: any = { status };
      if (status === 'acknowledged') patch.acknowledged_at = new Date().toISOString();
      if (status === 'resolved') patch.resolved_at = new Date().toISOString();
      const { error } = await supabase.from('financial_alerts').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_alerts'] });
      toastSuccess('Alerta atualizado');
    },
    onError: handleMutationError,
  });
}

export function useSuggestCategory(partyName: string, partyKind: 'supplier' | 'client') {
  return useQuery({
    queryKey: ['suggest_category', partyKind, partyName],
    enabled: !!partyName && partyName.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('suggest_category', {
        _party_name: partyName,
        _party_kind: partyKind,
      });
      if (error) throw error;
      return (data ?? []) as Array<{
        category_id: string;
        category_name: string;
        confidence: number;
        usage_count: number;
      }>;
    },
  });
}
