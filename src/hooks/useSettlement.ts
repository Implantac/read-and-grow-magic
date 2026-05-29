import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mutationErrorHandler } from '@/lib/toastHelpers';

export type PaymentSplit = {
  payment_method: 'pix' | 'boleto' | 'credit_card' | 'debit_card' | 'transfer' | 'cash' | 'check';
  amount: number;
  bank_account_id?: string | null;
  reference?: string | null;
  notes?: string | null;
};

export type SettleParams = {
  source_type: 'receivable' | 'payable';
  source_id: string;
  splits: PaymentSplit[];
  settlement_date?: string;
  interest?: number;
  penalty?: number;
  discount?: number;
  notes?: string;
};

export function useSettleAccount() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (params: SettleParams) => {
      const { data, error } = await supabase.rpc('settle_account', {
        _source_type: params.source_type,
        _source_id: params.source_id,
        _splits: params.splits as any,
        _settlement_date: params.settlement_date ?? new Date().toISOString().slice(0, 10),
        _interest: params.interest ?? 0,
        _penalty: params.penalty ?? 0,
        _discount: params.discount ?? 0,
        _notes: params.notes ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts_receivable'] });
      qc.invalidateQueries({ queryKey: ['accounts_payable'] });
      qc.invalidateQueries({ queryKey: ['financial_settlements'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      qc.invalidateQueries({ queryKey: ['bank_accounts'] });
      toast({ title: 'Liquidação concluída', description: 'Baixa registrada com sucesso' });
    },
    onError: mutationErrorHandler('Erro na liquidação'),
  });
}

export function useCompensateAccounts() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (p: { receivable_id: string; payable_id: string; amount: number; notes?: string }) => {
      const { data, error } = await supabase.rpc('compensate_accounts', {
        _receivable_id: p.receivable_id,
        _payable_id: p.payable_id,
        _amount: p.amount,
        _notes: p.notes ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts_receivable'] });
      qc.invalidateQueries({ queryKey: ['accounts_payable'] });
      qc.invalidateQueries({ queryKey: ['financial_settlements'] });
      qc.invalidateQueries({ queryKey: ['financial_offsets'] });
      toast({ title: 'Compensação efetivada' });
    },
    onError: mutationErrorHandler('Erro na compensação'),
  });
}

export type StatementRow = {
  entry_date: string;
  kind: 'debit' | 'credit';
  category: string;
  description: string;
  reference: string | null;
  amount: number;
  running_balance: number;
};

export function useAccountStatement(entityType: 'client' | 'supplier' | null, entityId: string | null, from?: string, to?: string) {
  return useQuery({
    queryKey: ['account_statement', entityType, entityId, from, to],
    enabled: !!entityType && !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_account_statement', {
        _entity_type: entityType!,
        _entity_id: entityId!,
        _from: from ?? new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10),
        _to: to ?? new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
      return (data ?? []) as StatementRow[];
    },
  });
}

export function usePaymentSplits(settlementId?: string) {
  return useQuery({
    queryKey: ['financial_payment_split', settlementId],
    enabled: !!settlementId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_payment_split')
        .select('*')
        .eq('settlement_id', settlementId!)
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });
}
