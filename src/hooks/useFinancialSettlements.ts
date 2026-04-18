import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SettlementRow {
  id: string;
  source_type: 'receivable' | 'payable' | 'advance';
  source_id: string;
  amount: number;
  interest: number;
  penalty: number;
  discount: number;
  total_settled: number;
  settlement_date: string;
  bank_account_id: string | null;
  payment_method: string | null;
  ledger_id: string | null;
  payment_record_id: string | null;
  status: 'active' | 'reversed';
  reversed_at: string | null;
  notes: string | null;
  created_at: string;
}

export function useSettlements(filters?: { sourceType?: string; sourceId?: string }) {
  return useQuery({
    queryKey: ['financial_settlements', filters],
    queryFn: async () => {
      let q = supabase.from('financial_settlements').select('*').order('settlement_date', { ascending: false });
      if (filters?.sourceType) q = q.eq('source_type', filters.sourceType);
      if (filters?.sourceId) q = q.eq('source_id', filters.sourceId);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return data as SettlementRow[];
    },
  });
}

export function useReverseSettlement() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('reverse_settlement', {
        _settlement_id: id,
        _reason: reason ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_settlements'] });
      qc.invalidateQueries({ queryKey: ['accounts_receivable'] });
      qc.invalidateQueries({ queryKey: ['accounts_payable'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      qc.invalidateQueries({ queryKey: ['bank_accounts'] });
      toast({ title: 'Baixa estornada com sucesso' });
    },
    onError: (e: any) => toast({ title: 'Erro ao estornar', description: e.message, variant: 'destructive' }),
  });
}

export function useUseAdvance() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (params: { advanceId: string; sourceType: 'receivable' | 'payable'; sourceId: string; amount: number; notes?: string }) => {
      const { data, error } = await supabase.rpc('use_advance', {
        _advance_id: params.advanceId,
        _source_type: params.sourceType,
        _source_id: params.sourceId,
        _amount: params.amount,
        _notes: params.notes ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_advances'] });
      qc.invalidateQueries({ queryKey: ['financial_settlements'] });
      qc.invalidateQueries({ queryKey: ['accounts_receivable'] });
      qc.invalidateQueries({ queryKey: ['accounts_payable'] });
      toast({ title: 'Adiantamento aplicado' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useTransferBetweenAccounts() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (params: { fromAccount: string; toAccount: string; amount: number; description?: string }) => {
      const { data, error } = await supabase.rpc('transfer_between_accounts', {
        _from_account: params.fromAccount,
        _to_account: params.toAccount,
        _amount: params.amount,
        _description: params.description ?? 'Transferência entre contas',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank_accounts'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      qc.invalidateQueries({ queryKey: ['bank_transfers'] });
      toast({ title: 'Transferência realizada' });
    },
    onError: (e: any) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

export function useBankTransfers() {
  return useQuery({
    queryKey: ['bank_transfers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bank_transfers').select('*').order('transfer_date', { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
}

export function useAdvanceTransactions(advanceId?: string) {
  return useQuery({
    queryKey: ['advance_transactions', advanceId],
    enabled: !!advanceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_advance_transactions')
        .select('*')
        .eq('advance_id', advanceId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useFinancialOperationsLog(limit = 100) {
  return useQuery({
    queryKey: ['financial_operations_log', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_operations_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}
