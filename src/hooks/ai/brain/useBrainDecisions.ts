import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import type { BrainDecision, DecisionRow } from './types';

type RealtimeFilter = Parameters<ReturnType<typeof supabase.channel>['on']>[1];

export function useBrainDecisions(status?: string) {
  const qc = useQueryClient();
  const companyId = useEnterpriseStore((s) => s.activeCompanyId);
  useEffect(() => {
    if (!companyId) return;
    let mounted = true;
    const ch = supabase
      .channel(`brain-decisions-rt:${companyId}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes' as unknown as 'system',
        { event: '*', schema: 'public', table: 'ai_brain_decisions', filter: `company_id=eq.${companyId}` } as unknown as RealtimeFilter,
        () => { if (mounted) qc.invalidateQueries({ queryKey: ['brain_decisions'] }); },
      )
      .on(
        'postgres_changes' as unknown as 'system',
        { event: '*', schema: 'public', table: 'ai_brain_runs', filter: `company_id=eq.${companyId}` } as unknown as RealtimeFilter,
        () => { if (mounted) qc.invalidateQueries({ queryKey: ['brain_runs'] }); },
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [qc, companyId]);

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
