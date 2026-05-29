import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual';
export type RecurringStatus = 'active' | 'paused' | 'cancelled' | 'finished';
export type RecurringKind = 'receivable' | 'payable';

export interface RecurringRow {
  id: string;
  kind: RecurringKind;
  description: string;
  party_name: string;
  client_id: string | null;
  supplier_id: string | null;
  category_id: string | null;
  bank_account_id: string | null;
  amount: number;
  frequency: RecurringFrequency;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  occurrences_generated: number;
  max_occurrences: number | null;
  adjustment_index: string | null;
  adjustment_percent: number;
  last_adjustment_at: string | null;
  status: RecurringStatus;
  notes: string | null;
  created_at: string;
}

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

export function useRecurringList(filters?: { kind?: RecurringKind; status?: RecurringStatus }) {
  return useQuery({
    queryKey: ['financial_recurring', filters],
    queryFn: async () => {
      let q = supabase.from('financial_recurring').select('*').order('next_run_date');
      if (filters?.kind) q = q.eq('kind', filters.kind);
      if (filters?.status) q = q.eq('status', filters.status);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return data as RecurringRow[];
    },
  });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Partial<RecurringRow>) => {
      const { data, error } = await supabase
        .from('financial_recurring')
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_recurring'] });
      toastSuccess('Recorrência criada');
    },
    onError: handleMutationError,
  });
}

export function useUpdateRecurringStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RecurringStatus }) => {
      const { error } = await supabase
        .from('financial_recurring')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_recurring'] });
      toastSuccess('Status atualizado');
    },
    onError: handleMutationError,
  });
}

export function useGenerateRecurringEntries() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('generate_recurring_entries');
      if (error) throw error;
      return data as { ok: boolean; created: number };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['financial_recurring'] });
      qc.invalidateQueries({ queryKey: ['accounts_receivable'] });
      qc.invalidateQueries({ queryKey: ['accounts_payable'] });
      toastSuccess('Geração concluída', `${data.created} contas geradas`);
    },
    onError: handleMutationError,
  });
}
