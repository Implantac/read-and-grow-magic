import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface ChargeRule {
  id: string;
  name: string;
  trigger_type: 'before_due' | 'on_due' | 'after_due';
  days_offset: number;
  severity: 'info' | 'warning' | 'critical';
  channel: 'in_app' | 'email' | 'whatsapp' | 'log_only';
  message_template: string;
  active: boolean;
  created_at: string;
}

export interface ChargeLog {
  id: string;
  receivable_id: string | null;
  client_id: string | null;
  client_name: string | null;
  rule_id: string | null;
  trigger_type: string;
  channel: string;
  severity: string;
  amount: number;
  due_date: string | null;
  days_until_due: number | null;
  message: string;
  status: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

export function useChargeRules() {
  return useQuery({
    queryKey: ['financial_charges_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_charges_rules')
        .select('*')
        .order('trigger_type')
        .order('days_offset');
      if (error) throw error;
      return data as ChargeRule[];
    },
  });
}

export function useChargesLog(filters?: { clientId?: string; severity?: string; days?: number }) {
  return useQuery({
    queryKey: ['financial_charges_log', filters],
    queryFn: async () => {
      let q = supabase.from('financial_charges_log').select('*').order('created_at', { ascending: false });
      if (filters?.clientId) q = q.eq('client_id', filters.clientId);
      if (filters?.severity) q = q.eq('severity', filters.severity);
      if (filters?.days) {
        const since = new Date(Date.now() - filters.days * 86400000).toISOString();
        q = q.gte('created_at', since);
      }
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return data as ChargeLog[];
    },
  });
}

export function useRunChargesRuler() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('process_charges_ruler');
      if (error) throw error;
      return data as { ok: boolean; inserted: number; executed_at: string };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['financial_charges_log'] });
      toastSuccess('Régua executada', `${data.inserted} cobranças geradas`);
    },
    onError: handleMutationError,
  });
}

export function useToggleChargeRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('financial_charges_rules')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_charges_rules'] });
      toastSuccess('Regra atualizada');
    },
    onError: handleMutationError,
  });
}
