import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback } from 'react';

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
  role: 'user' | 'assistant';
  content: string;
}

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

export function useExecutiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantSoFar = '';

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-executive`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action: 'chat', messages: newMessages }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Chat failed: ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch { /* partial */ }
        }
      }
    } catch (e) {
      console.error('Chat error:', e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao processar sua pergunta. Tente novamente.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearChat };
}
