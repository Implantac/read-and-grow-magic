import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback, useEffect, useRef } from 'react';

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
  moMGrowth: number;
  yoYGrowth: number;
  clientsAtRisk: number;
  cashFlowProjection30d: number;
  futureReceivables: number;
  futurePayables: number;
  currentRatio: number;
  quickRatio: number;
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
  growthTrends: { month: string; revenueMoM: number; revenueYoY: number; margin: number }[];
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

export function useExecutiveDashboard(months: number = 12) {
  return useQuery({
    queryKey: ['executive-dashboard', months],
    queryFn: async (): Promise<ExecutiveDashboardData> => {
      const { data, error } = await supabase.functions.invoke('ai-executive', {
        body: { action: 'dashboard', months },
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

// ─── Session Persistence Helpers ────────────────────────────────

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout
const SESSION_KEY = 'executive_chat_session';

interface SessionData {
  messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[];
  lastActivity: string;
}

function loadSession(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const session: SessionData = JSON.parse(raw);
    const lastActivity = new Date(session.lastActivity).getTime();
    if (Date.now() - lastActivity > SESSION_TIMEOUT_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return [];
    }
    return session.messages.map(m => ({
      id: crypto.randomUUID(),
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}

function saveSession(messages: ChatMessage[]) {
  try {
    const session: SessionData = {
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      })),
      lastActivity: new Date().toISOString(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { /* ignore storage errors */ }
}

// ─── Unified Chat (Tool-Calling + Memory) ───────────────────────

export function useUnifiedChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadSession());
  const [isLoading, setIsLoading] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Persist messages to sessionStorage on every change
  useEffect(() => {
    saveSession(messages);
  }, [messages]);

  // Load server-side history on mount if session is empty
  useEffect(() => {
    if (messages.length === 0 && userId) {
      supabase
        .from('ai_executive_chat')
        .select('role, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(30)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const restored = data.map((m: any) => ({
              id: crypto.randomUUID(),
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.created_at),
            }));
            setMessages(restored);
          }
        });
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset inactivity timer on every interaction
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setMessages([]);
      sessionStorage.removeItem(SESSION_KEY);
    }, SESSION_TIMEOUT_MS);
  }, []);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  const sendMessage = useCallback(async (input: string) => {
    resetInactivityTimer();

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Send FULL conversation history for context continuity
      const chatHistory = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-executive', {
        body: { action: 'assistant_chat', messages: chatHistory, user_id: userId },
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
  }, [messages, resetInactivityTimer, userId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    sessionStorage.removeItem(SESSION_KEY);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    // Clear server-side history
    if (userId) {
      supabase.functions.invoke('ai-executive', {
        body: { action: 'clear_history', user_id: userId },
      }).catch(() => {});
    }
  }, [userId]);

  return { messages, isLoading, sendMessage, clearChat };
}
