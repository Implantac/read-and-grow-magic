import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface RiskProfile {
  id: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  total_transactions: number;
  total_volume: number;
  avg_ticket: number;
  max_ticket: number;
  anomalies_count: number;
  blocked_count: number;
  last_anomaly_at: string | null;
  last_transaction_at: string | null;
  updated_at: string;
}

export interface SecurityLog {
  id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string | null;
  entity_type: string | null;
  entity_label?: string | null;
  amount: number | null;
  risk_score: number | null;
  decision: 'allow' | 'review' | 'block' | 'log' | null;
  details: any;
  resolved: boolean;
  created_at: string;
}

export interface FraudRule {
  id: string;
  rule_key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  severity: string;
  threshold: number | null;
  window_minutes: number | null;
  action: 'log' | 'review' | 'block';
}

export function useRiskProfiles(level?: string) {
  return useQuery({
    queryKey: ['financial_risk_profiles', level],
    queryFn: async () => {
      let q = supabase.from('financial_risk_profiles' as any).select('*').order('risk_score', { ascending: false }).limit(100);
      if (level) q = q.eq('risk_level', level);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as RiskProfile[];
    },
  });
}

export function useSecurityLogs(filters?: { resolved?: boolean; severity?: string }) {
  return useQuery({
    queryKey: ['financial_security_logs', filters],
    queryFn: async () => {
      let q = supabase.from('financial_security_logs' as any).select('*').order('created_at', { ascending: false }).limit(200);
      if (filters?.resolved !== undefined) q = q.eq('resolved', filters.resolved);
      if (filters?.severity) q = q.eq('severity', filters.severity);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as SecurityLog[];
    },
    refetchInterval: 60_000,
  });
}

export function useFraudRules() {
  return useQuery({
    queryKey: ['financial_fraud_rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('financial_fraud_rules' as any).select('*').order('rule_key');
      if (error) throw error;
      return (data ?? []) as unknown as FraudRule[];
    },
  });
}

export function useUpdateFraudRule() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<FraudRule> & { id: string }) => {
      const { error } = await supabase.from('financial_fraud_rules' as any).update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_fraud_rules'] });
      toastSuccess('Regra atualizada');
    },
    onError: handleMutationError,
  });
}

export function useResolveSecurityLog() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_security_logs' as any)
        .update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_security_logs'] });
      toastSuccess('Marcado como resolvido');
    },
    onError: handleMutationError,
  });
}
