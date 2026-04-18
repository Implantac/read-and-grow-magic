import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FinancialHealthScore {
  id: string;
  reference_date: string;
  score_total: number;
  score_grade: 'A' | 'B' | 'C' | 'D' | 'E';
  liquidity_score: number;
  delinquency_score: number;
  cashflow_score: number;
  growth_score: number;
  current_ratio: number;
  cash_runway_days: number;
  delinquency_rate: number;
  recommendations: any[];
  details: any;
  created_at: string;
}

export interface PredictiveAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string | null;
  predicted_date: string | null;
  predicted_amount: number | null;
  recommended_action: string | null;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  created_at: string;
}

export function useLatestHealthScore() {
  return useQuery({
    queryKey: ['financial_health_score'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_health_scores' as any).select('*')
        .order('reference_date', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data as unknown as FinancialHealthScore | null;
    },
  });
}

export function usePredictiveAlerts() {
  return useQuery({
    queryKey: ['financial_predictive_alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_predictive_alerts' as any).select('*')
        .eq('status', 'active').order('severity', { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as PredictiveAlert[];
    },
    refetchInterval: 120_000,
  });
}

export function useComputeIntelligence() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('financial-intelligence?action=compute', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['financial_health_score'] });
      qc.invalidateQueries({ queryKey: ['financial_predictive_alerts'] });
      toast({
        title: 'Inteligência financeira atualizada',
        description: `Score: ${data?.score?.score ?? '-'} (${data?.score?.grade ?? '-'}) · ${data?.risks?.alerts_created ?? 0} novos alertas`,
      });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useAutoReconcile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('financial-intelligence?action=auto-reconcile', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['bank_transactions'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      toast({ title: 'Conciliação automática', description: `${data?.matched ?? 0} de ${data?.processed ?? 0} transações conciliadas` });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}
