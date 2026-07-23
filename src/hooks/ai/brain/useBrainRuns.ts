import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BrainRun, RunRow } from './types';

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

export function useNotifyCritical() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-brain', { body: { action: 'notify_critical' } });
      if (error) throw error;
      return data;
    },
  });
}
