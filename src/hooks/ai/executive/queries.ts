import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ExecutiveDashboardData } from './types';

export function useExecutiveDashboard(months: number = 12, segment: string = 'general') {
  return useQuery({
    queryKey: ['executive-dashboard', months, segment],
    queryFn: async (): Promise<ExecutiveDashboardData> => {
      const { data, error } = await supabase.functions.invoke('ai-executive', {
        body: { action: 'dashboard', months, segment },
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
