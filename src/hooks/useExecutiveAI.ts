import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────

export interface ExecutiveKPIs {
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  grossMargin: number;
  overdueReceivable: number;
  overduePayable: number;
  totalReceivable: number;
  totalPayable: number;
  netPosition: number;
  activeClients: number;
  lowStockProducts: number;
  defaultRate: number;
  concentrationPct: number;
  avgTicket: number;
  revenueGrowth: number;
  clientsAtRisk: number;
  cashFlowProjection30d: number;
  futureReceivables: number;
  futurePayables: number;
  prodEfficiency: number;
  prodInProgress: number;
  prodPlanned: number;
  prodCompleted: number;
  targetAttainment: number;
  totalTarget: number;
  totalAchieved: number;
}

export interface ExecutiveInsight {
  id: string;
  insight_type: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  explanation: string;
  data_points: any;
  impact_estimate: string;
  recommended_actions: string[];
  module: string;
  status: string;
  created_at: string;
}

export interface ExecutiveAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  module: string;
  metric_name: string;
  metric_value: number;
  threshold_value: number;
  trend: string;
  status: string;
  created_at: string;
}

export interface SalesRepStat {
  id: string;
  name: string;
  orders: number;
  revenue: number;
}

export interface ExecutiveDashboardData {
  kpis: ExecutiveKPIs;
  revenueByMonth: { month: string; revenue: number }[];
  topClients: { name: string; revenue: number }[];
  expenseByCategory: Record<string, number>;
  salesRepStats: SalesRepStat[];
  funnelByStage: Record<string, { count: number; value: number }>;
  insights: ExecutiveInsight[];
  alerts: ExecutiveAlert[];
  scenarios: any[];
  summary: { totalOrders: number; totalProducts: number; totalClients: number; productionOrders: number; funnelOpportunities: number };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Dashboard Query ────────────────────────────────────────────

export function useExecutiveDashboard() {
  return useQuery({
    queryKey: ['executive-dashboard'],
    queryFn: async (): Promise<ExecutiveDashboardData> => {
      const { data, error } = await supabase.functions.invoke('ai-executive', {
        body: { action: 'dashboard' },
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 120_000,
  });
}

// ─── Mutations ──────────────────────────────────────────────────

export function useGenerateInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-executive', {
        body: { action: 'generate_insights' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['executive-dashboard'] });
    },
  });
}

export function useGenerateScenarios() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-executive', {
        body: { action: 'generate_scenarios' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['executive-dashboard'] });
    },
  });
}

export function useDailySummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-executive', {
        body: { action: 'daily_summary' },
      });
      if (error) throw error;
      return data;
    },
  });
}

// ─── Unified Chat (Tool-Calling) ────────────────────────────────

export function useUnifiedChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-executive', {
        body: { action: 'assistant_chat', messages: chatHistory },
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.content || 'Não foi possível processar.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error('Chat error:', e);
      const errMsg = e instanceof Error ? e.message : '';
      let content = '❌ Erro ao processar. Tente novamente.';
      if (errMsg.includes('429')) content = '⏳ Limite de requisições excedido. Aguarde alguns minutos.';
      else if (errMsg.includes('402')) content = '💳 Créditos insuficientes. Adicione créditos em Configurações > Workspace.';
      
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearChat };
}
