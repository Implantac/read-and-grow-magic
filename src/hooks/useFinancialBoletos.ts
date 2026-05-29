import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BoletoStatus } from '@/types/financial';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface FinancialBoleto {
  id: string;
  receivable_id: string | null;
  client_id: string | null;
  client_name: string | null;
  amount: number;
  due_date: string;
  digitable_line: string | null;
  barcode: string | null;
  our_number: string | null;
  document_number: string | null;
  pdf_url: string | null;
  provider: string;
  external_id: string | null;
  status: BoletoStatus;
  paid_at: string | null;
  paid_amount: number | null;
  bank_account_id: string | null;
  notes: string | null;
  created_at: string;
}

// Mock generator: creates a fake digitable line + our_number locally.
// Replace by edge function when boleto provider is configured.
function mockBoleto(amount: number) {
  const onum = String(Date.now()).slice(-10);
  const cents = Math.round(amount * 100).toString().padStart(10, '0');
  const part = (n: number) => Math.floor(Math.random() * 1e5).toString().padStart(5, '0');
  const dig = `${part(0)}.${part(0)} ${part(0)}.${part(0)} ${part(0)}.${part(0)} 1 9999${cents}`;
  return { our_number: onum, digitable_line: dig, barcode: dig.replace(/[^0-9]/g, '') };
}

export function useFinancialBoletos(filters?: { status?: string }) {
  return useQuery({
    queryKey: ['financial_boletos', filters],
    queryFn: async () => {
      let q = supabase.from('financial_boletos' as any).select('*').order('due_date', { ascending: true });
      if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status);
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as FinancialBoleto[];
    },
  });
}

export function useCreateBoleto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { receivable_id?: string; client_id?: string; client_name?: string; amount: number; due_date: string; bank_account_id?: string; notes?: string }) => {
      const fake = mockBoleto(input.amount);
      const { data, error } = await supabase.from('financial_boletos' as any).insert({
        ...input,
        ...fake,
        provider: 'mock',
        status: 'registered',
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_boletos'] });
      toastSuccess('Boleto gerado', 'Linha digitável disponível');
    },
    onError: handleMutationError,
  });
}

export function useCancelBoleto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_boletos' as any).update({ status: 'cancelled' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_boletos'] });
      toastSuccess('Boleto cancelado');
    },
    onError: handleMutationError,
  });
}

// Marks boleto as paid + creates payment_record on the linked receivable
// (the existing payment_records trigger will update the receivable + ledger)
export function useMarkBoletoPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; bank_account_id?: string }) => {
      const { data: bol, error: e1 } = await supabase.from('financial_boletos' as any).select('*').eq('id', params.id).single();
      if (e1) throw e1;
      const boleto = bol as any;
      if (boleto.receivable_id) {
        const { error: e2 } = await supabase.from('payment_records').insert({
          receivable_id: boleto.receivable_id,
          payable_id: null,
          amount: boleto.amount,
          interest: 0, penalty: 0, discount: 0,
          total_paid: boleto.amount,
          payment_method: 'boleto',
          payment_date: new Date().toISOString().split('T')[0],
          bank_account_id: params.bank_account_id ?? boleto.bank_account_id ?? null,
          notes: `Baixa automática boleto ${boleto.our_number ?? ''}`.trim(),
          created_by: null,
        });
        if (e2) throw e2;
      }
      const { error: e3 } = await supabase.from('financial_boletos' as any).update({
        status: 'paid', paid_at: new Date().toISOString(), paid_amount: boleto.amount,
      }).eq('id', params.id);
      if (e3) throw e3;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financial_boletos'] });
      qc.invalidateQueries({ queryKey: ['accounts_receivable'] });
      qc.invalidateQueries({ queryKey: ['financial_ledger'] });
      qc.invalidateQueries({ queryKey: ['bank_accounts'] });
      toastSuccess('Boleto baixado com sucesso');
    },
    onError: handleMutationError,
  });
}
