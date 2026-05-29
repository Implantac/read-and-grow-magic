import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useEffect, useState } from 'react';

export interface BrainDecision {
  id: string;
  module: string;
  decision_type: string;
  title: string;
  rationale: string;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  risk_level: 'low' | 'medium' | 'high';
  confidence: number;
  evidence: any;
  proposed_action: any;
  status: string;
  auto_executable: boolean;
  requires_approval: boolean;
  execution_result: any;
  created_at: string;
}

export interface BrainMemory {
  id: string;
  category: string;
  key: string;
  value: any;
  importance: number;
  scope: string;
  updated_at: string;
}

export interface BrainRun {
  id: string;
  trigger: string;
  mode: string;
  synthesis: string | null;
  structured: any;
  decisions_count: number;
  duration_ms: number | null;
  status: string;
  created_at: string;
}

// ─── Decisions ─────────────────────────────
export function useBrainDecisions(status?: string) {
  return useQuery({
    queryKey: ['brain_decisions', status],
    queryFn: async () => {
      let q = supabase
        .from('ai_brain_decisions' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as BrainDecision[];
    },
    refetchInterval: 60_000,
  });
}

export function useApproveDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { data, error } = await supabase.functions.invoke('ai-brain', {
export function useApproveDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { data, error } = await supabase.functions.invoke('ai-brain', {
        body: { action: approve ? 'approve_decision' : 'reject_decision', decision_id: id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brain_decisions'] }),
  });
}

export function useExecuteDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('ai-brain', {
        body: { action: 'execute_decision', decision_id: id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brain_decisions'] }),
  });
}

      const { data, error } = await supabase
        .from('ai_brain_memory' as any)
        .select('*')
        .order('importance', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as BrainMemory[];
    },
  });
}

export function useSaveMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memory: { category: string; key: string; value: any; importance?: number; scope?: string }) => {
      const { data, error } = await supabase.functions.invoke('ai-brain', {
        body: { action: 'save_memory', memory },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brain_memories'] }),
  });
}

// ─── Runs ─────────────────────────────────
export function useBrainRuns() {
  return useQuery({
    queryKey: ['brain_runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_brain_runs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as BrainRun[];
    },
  });
}

export function useRunBrain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mode: 'analyze' | 'autopilot' = 'analyze') => {
      const { data, error } = await supabase.functions.invoke('ai-brain', {
        body: { action: mode },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['brain_decisions'] });
      qc.invalidateQueries({ queryKey: ['brain_runs'] });
      qc.invalidateQueries({ queryKey: ['brain_memories'] });
    },
  });
}

// ─── Chat ─────────────────────────────────
export interface BrainChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function useBrainChat() {
  const [messages, setMessages] = useState<BrainChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const send = useCallback(async (text: string) => {
    const userMsg: BrainChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke('ai-brain', {
        body: { action: 'chat', messages: history },
      });
      if (error) throw error;
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: data?.content || '—' },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: '❌ ' + (e?.message || 'Erro') },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clear = useCallback(() => setMessages([]), []);
  return { messages, loading, send, clear };
}
