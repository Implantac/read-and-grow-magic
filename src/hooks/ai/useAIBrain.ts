import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useCallback, useEffect, useState } from 'react';

// Loose JSON object shape — brain payloads are heterogeneous and consumed by many
// widgets that read arbitrary keys. Keeping it permissive avoids forcing casts in callers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BrainJson = Record<string, any> | any[] | string | number | boolean | null;

type RealtimeFilter = Parameters<ReturnType<typeof supabase.channel>['on']>[1];

export interface BrainDecision {
  id: string;
  module: string;
  decision_type: string;
  title: string;
  rationale: string;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  risk_level: 'low' | 'medium' | 'high';
  confidence: number;
  evidence: BrainJson;
  proposed_action: BrainJson;
  status: string;
  auto_executable: boolean;
  requires_approval: boolean;
  execution_result: BrainJson;
  created_at: string;
}

export interface BrainMemory {
  id: string;
  category: string;
  key: string;
  value: BrainJson;
  importance: number;
  scope: string;
  updated_at: string;
}

export interface BrainRun {
  id: string;
  trigger: string;
  mode: string;
  synthesis: string | null;
  structured: BrainJson;
  decisions_count: number;
  duration_ms: number | null;
  status: string;
  created_at: string;
}

type DecisionRow = Database['public']['Tables']['ai_brain_decisions']['Row'];
type MemoryRow = Database['public']['Tables']['ai_brain_memory']['Row'];
type RunRow = Database['public']['Tables']['ai_brain_runs']['Row'];

// ─── Decisions ─────────────────────────────
export function useBrainDecisions(status?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    let mounted = true;
    const ch = supabase
      .channel(`brain-decisions-rt-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes' as unknown as 'system',
        { event: '*', schema: 'public', table: 'ai_brain_decisions' } as unknown as RealtimeFilter,
        () => { if (mounted) qc.invalidateQueries({ queryKey: ['brain_decisions'] }); },
      )
      .on(
        'postgres_changes' as unknown as 'system',
        { event: '*', schema: 'public', table: 'ai_brain_runs' } as unknown as RealtimeFilter,
        () => { if (mounted) qc.invalidateQueries({ queryKey: ['brain_runs'] }); },
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [qc]);

  return useQuery({
    queryKey: ['brain_decisions', status],
    queryFn: async () => {
      let q = supabase
        .from('ai_brain_decisions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return ((data ?? []) as DecisionRow[]) as unknown as BrainDecision[];
    },
    refetchInterval: 60_000,
  });
}

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

// ─── Memories ─────────────────────────────
export function useBrainMemories() {
  return useQuery({
    queryKey: ['brain_memories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_brain_memory')
        .select('*')
        .order('importance', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return ((data ?? []) as MemoryRow[]) as unknown as BrainMemory[];
    },
  });
}

export interface SaveMemoryInput {
  category: string;
  key: string;
  value: BrainJson;
  importance?: number;
  scope?: string;
}

export function useSaveMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memory: SaveMemoryInput) => {
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
        .from('ai_brain_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return ((data ?? []) as RunRow[]) as unknown as BrainRun[];
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

export interface BrainChatAction {
  tool: string;
  args: BrainJson;
  result: BrainJson;
}

export interface BrainChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: BrainChatAction[];
}

export function useBrainChat() {
  const [messages, setMessages] = useState<BrainChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const send = useCallback(async (text: string, agent: string = 'geral') => {
    const userMsg: BrainChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke('ai-brain', {
        body: { action: 'chat', messages: history, agent },
      });
      if (error) throw error;
      const payload = (data ?? {}) as { content?: string; actions?: BrainChatAction[] };
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: payload.content || '—', actions: payload.actions || [] },
      ]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro';
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: '❌ ' + message },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clear = useCallback(() => setMessages([]), []);
  return { messages, loading, send, clear };
}

export function useNotifyCritical() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-brain', { body: { action: 'notify_critical' } });
      if (error) throw error;
      return data;
    },
  });
}

// ─── Learning analytics ─────────────────────────────
export interface LearningStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  autoExecuted: number;
  executed: number;
  approvalRate: number;
  rejectionRate: number;
  avgConfidence: number;
  byModule: Array<{ module: string; total: number; approved: number; rejected: number; auto: number }>;
  calibration: Array<{ bucket: string; declared: number; actual: number; n: number }>;
  recentRejected: BrainDecision[];
  topMemories: BrainMemory[];
}

export function useBrainLearning() {
  return useQuery({
    queryKey: ['brain_learning'],
    refetchInterval: 60_000,
    queryFn: async (): Promise<LearningStats> => {
      const [{ data: decs }, { data: mems }] = await Promise.all([
        supabase.from('ai_brain_decisions').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('ai_brain_memory').select('*').order('importance', { ascending: false }).limit(10),
      ]);
      const list = ((decs ?? []) as DecisionRow[]) as unknown as BrainDecision[];
      const total = list.length;
      const approved = list.filter((d) => d.status === 'approved' || d.status === 'executed').length;
      const rejected = list.filter((d) => d.status === 'rejected').length;
      const pending = list.filter((d) => d.status === 'pending').length;
      const autoExecuted = list.filter((d) => d.status === 'auto_executed').length;
      const executed = list.filter((d) => d.status === 'executed').length;
      const closed = approved + rejected + autoExecuted + executed;
      const positives = approved + autoExecuted + executed;
      const approvalRate = closed > 0 ? positives / closed : 0;
      const rejectionRate = closed > 0 ? rejected / closed : 0;
      const avgConfidence = total > 0 ? list.reduce((s, d) => s + (Number(d.confidence) || 0), 0) / total : 0;

      const byModuleMap = new Map<string, { total: number; approved: number; rejected: number; auto: number }>();
      for (const d of list) {
        const k = d.module || 'global';
        const cur = byModuleMap.get(k) || { total: 0, approved: 0, rejected: 0, auto: 0 };
        cur.total++;
        if (d.status === 'approved' || d.status === 'executed') cur.approved++;
        if (d.status === 'rejected') cur.rejected++;
        if (d.status === 'auto_executed') cur.auto++;
        byModuleMap.set(k, cur);
      }
      const byModule = Array.from(byModuleMap.entries()).map(([module, v]) => ({ module, ...v })).sort((a, b) => b.total - a.total);

      const buckets = [
        { label: '0-40%', min: 0, max: 0.4 },
        { label: '40-60%', min: 0.4, max: 0.6 },
        { label: '60-75%', min: 0.6, max: 0.75 },
        { label: '75-90%', min: 0.75, max: 0.9 },
        { label: '90-100%', min: 0.9, max: 1.01 },
      ];
      const calibration = buckets.map((b) => {
        const inB = list.filter((d) => Number(d.confidence) >= b.min && Number(d.confidence) < b.max);
        const closedB = inB.filter((d) => ['approved', 'rejected', 'auto_executed', 'executed'].includes(d.status));
        const okB = inB.filter((d) => ['approved', 'auto_executed', 'executed'].includes(d.status));
        const declared = inB.length ? inB.reduce((s, d) => s + Number(d.confidence), 0) / inB.length : 0;
        const actual = closedB.length ? okB.length / closedB.length : 0;
        return { bucket: b.label, declared: Math.round(declared * 100), actual: Math.round(actual * 100), n: inB.length };
      });

      const recentRejected = list.filter((d) => d.status === 'rejected').slice(0, 10);

      return {
        total, approved, rejected, pending, autoExecuted, executed,
        approvalRate, rejectionRate, avgConfidence,
        byModule, calibration, recentRejected,
        topMemories: ((mems ?? []) as MemoryRow[]) as unknown as BrainMemory[],
      };
    },
  });
}
