import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { handleMutationError, mutationErrorHandler, toastSuccess } from '@/lib/toastHelpers';
export interface AuditLog {
  id: string;
  audit_run_id: string;
  level: 'low' | 'medium' | 'high';
  category: string;
  check_name: string;
  description: string;
  details: any;
  affected_count: number;
  affected_amount: number;
  status: 'open' | 'resolved' | 'ignored' | 'auto_fixed';
  auto_fixed: boolean;
  resolved_at: string | null;
  created_at: string;
}

export function useFinancialAuditLogs() {
  return useQuery({
    queryKey: ['financial_audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_audit_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as AuditLog[];
    },
    refetchInterval: 60_000,
  });
}

export function useRunFinancialAudit() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (mode: 'light' | 'full' = 'light') => {
      const { data, error } = await supabase.functions.invoke('financial-audit', {
        body: null,
        method: 'POST' as any,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['financial_audit_logs'] });
      const r = data?.result;
      toastSuccess('Auditoria executada', `${r?.issues_open ?? 0} problemas abertos · ${r?.auto_fixed ?? 0} auto-corrigidos`);
    },
    onError: mutationErrorHandler('Erro na auditoria'),
  });
}

export function useResolveAuditLog() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_audit_logs' as any)
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_audit_logs'] });
      toastSuccess('Marcado como resolvido');
    },
    onError: handleMutationError,
  });
}
