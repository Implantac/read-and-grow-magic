import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CEORisk {
  tipo: string;
  impacto: 'alto' | 'medio' | 'baixo' | string;
  titulo: string;
  detalhe: string;
}

export interface CEOPlanItem { tipo: 'meta' | 'acao' | string; titulo: string; detalhe: string; }
export interface CEODecision { type: string; priority: string; action: string; requires_approval: boolean; }
export interface CEOForecast { previsao_proximo_mes: number; media_movel_6m: number; ultimo_mes: number; trend: 'up' | 'down' | 'stable'; }
export interface CEOKPI { snapshot_date: string; kpi_name: string; category: string; current_value: number; target_value: number; status: string; trend: string | null; explanation: string; }

export interface CEOBriefResult {
  ceo_analysis: string;
  context: any;
  kpis: CEOKPI[];
  forecast: CEOForecast;
  risks: CEORisk[];
  plan: CEOPlanItem[];
  decisions: CEODecision[];
  generated_at: string;
}

export function useGenerateCEOBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<CEOBriefResult> => {
      const { data, error } = await supabase.functions.invoke('ai-executive', {
        body: { action: 'ceo_brief' },
      });
      if (error) throw error;
      return data as CEOBriefResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-kpis-history'] });
    },
  });
}

export function useKPIHistory(days = 30) {
  return useQuery({
    queryKey: ['ai-kpis-history', days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('ai_kpis')
        .select('*')
        .gte('snapshot_date', since)
        .order('snapshot_date', { ascending: false });
      if (error) throw error;
      return data as CEOKPI[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
