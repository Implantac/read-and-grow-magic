import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BrainDecision, BrainMemory, DecisionRow, LearningStats, MemoryRow } from './types';

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
