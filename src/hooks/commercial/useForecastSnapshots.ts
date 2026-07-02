import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { toast } from 'sonner';

export interface ForecastSnapshot {
  id: string;
  company_id: string | null;
  forecast_date: string;
  period: string;
  period_key: string | null;
  snapshot_type: string | null;
  predicted_revenue: number;
  actual_revenue: number;
  target_revenue: number;
  gap: number;
  variance_pct: number;
  by_rep: Record<string, number> | null;
  factors: Record<string, unknown> | null;
  created_at: string;
}

/** Listagem histórica de snapshots de forecast por empresa/período. */
export function useForecastSnapshots(periodKey?: string) {
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);

  return useQuery({
    queryKey: ['forecast_snapshots', companyId, periodKey ?? 'all'],
    enabled: !!companyId,
    staleTime: 60_000,
    queryFn: async (): Promise<ForecastSnapshot[]> => {
      let q = supabase
        .from('ai_forecast_snapshots')
        .select('*')
        .eq('company_id', companyId!)
        .order('forecast_date', { ascending: true })
        .limit(60);
      if (periodKey) q = q.eq('period_key', periodKey);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ForecastSnapshot[];
    },
  });
}

/** Dispara `record_forecast_snapshot` para capturar snapshot manual. */
export function useRecordForecastSnapshot() {
  const qc = useQueryClient();
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);

  return useMutation({
    mutationFn: async (periodKey: string) => {
      if (!companyId) throw new Error('Empresa ativa não definida');
      const { data, error } = await supabase.rpc('record_forecast_snapshot', {
        _company_id: companyId,
        _period_key: periodKey,
        _snapshot_type: 'manual',
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      toast.success('Snapshot capturado', { description: 'Histórico atualizado.' });
      qc.invalidateQueries({ queryKey: ['forecast_snapshots', companyId] });
    },
    onError: (e: Error) => {
      toast.error('Falha ao capturar snapshot', { description: e.message });
    },
  });
}
