import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

// ─── Types ─────────────────────────────────────────────────────────────
export interface AIScore {
  id: string;
  client_id: string;
  score_numeric: number;
  score_grade: string;
  priority_level: string;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  risk_score: number;
  growth_score: number;
  engagement_score: number;
  days_since_purchase: number;
  purchase_trend: string;
  churn_probability: number;
  recompra_probability: number;
  explanation: string | null;
  computed_at: string;
  clients?: {
    id: string;
    name: string;
    code: string;
    segment: string | null;
    phone: string;
    cellphone: string | null;
  };
}

export interface AIRecommendation {
  id: string;
  client_id: string;
  recommendation_type: string;
  title: string;
  description: string | null;
  explanation: string | null;
  suggested_products: any;
  estimated_value: number;
  confidence: number;
  priority: string;
  status: string;
  acted_at: string | null;
  created_at: string;
  clients?: { id: string; name: string; code: string };
}

export interface AIInsight {
  id: string;
  insight_type: string;
  target_role: string;
  title: string;
  description: string;
  explanation: string | null;
  severity: string;
  data_points: any;
  suggested_actions: string[];
  status: string;
  created_at: string;
}

export interface AIDailyAction {
  id: string;
  sales_rep_id: string | null;
  client_id: string;
  action_date: string;
  action_type: string;
  priority: number;
  title: string;
  description: string | null;
  explanation: string | null;
  estimated_value: number;
  status: string;
  completed_at: string | null;
  result: string | null;
  created_at: string;
  clients?: { id: string; name: string; code: string; phone: string; cellphone: string | null };
}

export interface AIPrediction {
  id: string;
  funnel_id: string | null;
  order_id: string | null;
  client_id: string | null;
  close_probability: number;
  loss_risk: number;
  predicted_close_date: string | null;
  predicted_value: number;
  recommended_action: string | null;
  key_factors: any;
  explanation: string | null;
  created_at: string;
  clients?: { id: string; name: string; code: string };
  sales_funnel?: { id: string; title: string; stage: string; value: number };
}

export interface AIForecast {
  id: string;
  period: string;
  forecast_date: string;
  predicted_revenue: number | null;
  best_case: number | null;
  worst_case: number | null;
  confidence: number | null;
  by_rep: any;
  by_segment: any;
  by_region: any;
  factors: any;
  created_at: string;
}

// ─── Queries ────────────────────────────────────────────────────────────

export function useAIScores() {
  return useQuery({
    queryKey: ['ai_sales_scores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_sales_scores')
        .select('*, clients(id, name, code, segment, phone, cellphone)')
        .order('score_numeric', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AIScore[];
    },
  });
}

export function useAIRecommendations(status?: string) {
  return useQuery({
    queryKey: ['ai_recommendations', status],
    queryFn: async () => {
      let q = supabase
        .from('ai_recommendations')
        .select('*, clients(id, name, code)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as AIRecommendation[];
    },
  });
}

export function useAIInsights(role?: string) {
  return useQuery({
    queryKey: ['ai_sales_insights', role],
    queryFn: async () => {
      let q = supabase
        .from('ai_sales_insights')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(30);
      if (role) q = q.eq('target_role', role);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as AIInsight[];
    },
  });
}

export function useAIDailyActions(date?: string) {
  const today = date || new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['ai_daily_actions', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_daily_actions')
        .select('*, clients(id, name, code, phone, cellphone)')
        .eq('action_date', today)
        .order('priority', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as AIDailyAction[];
    },
  });
}

export function useAIPredictions() {
  return useQuery({
    queryKey: ['ai_opportunity_predictions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_opportunity_predictions')
        .select('*, clients:client_id(id, name, code), sales_funnel:funnel_id(id, title, stage, value)')
        .order('close_probability', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as AIPrediction[];
    },
  });
}

export function useAIForecasts() {
  return useQuery({
    queryKey: ['ai_forecast_snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_forecast_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as unknown as AIForecast[];
    },
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────

export function useRunAIEngine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action: string) => {
      const { data, error } = await supabase.functions.invoke('ai-commercial', {
        body: { action },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai_sales_scores'] });
      qc.invalidateQueries({ queryKey: ['ai_recommendations'] });
      qc.invalidateQueries({ queryKey: ['ai_sales_insights'] });
      qc.invalidateQueries({ queryKey: ['ai_daily_actions'] });
      qc.invalidateQueries({ queryKey: ['ai_opportunity_predictions'] });
      qc.invalidateQueries({ queryKey: ['ai_forecast_snapshots'] });
      toastSuccess('✨ IA Comercial', 'Motor executado com sucesso!');
    },
    onError: (e: Error) => {
      const msg = e.message.includes('429') ? 'Limite de requisições excedido. Tente novamente em alguns minutos.'
        : e.message.includes('402') ? 'Créditos insuficientes. Adicione créditos em Configurações > Workspace.'
        : e.message;
      toastError(msg, undefined, 'Erro na IA');
    },
  });
}

export function useCompleteAIAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, result }: { id: string; result: string }) => {
      const { error } = await supabase
        .from('ai_daily_actions')
        .update({ status: 'completed', completed_at: new Date().toISOString(), result })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai_daily_actions'] }),
  });
}

export function useActOnRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, result }: { id: string; result: string }) => {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ status: 'acted', acted_at: new Date().toISOString(), result })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai_recommendations'] }),
  });
}

export function useDismissInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_sales_insights')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai_sales_insights'] }),
  });
}
