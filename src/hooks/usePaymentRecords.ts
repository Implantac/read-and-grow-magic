import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentRecordRow {
  id: string;
  receivable_id: string | null;
  payable_id: string | null;
  amount: number;
  interest: number;
  penalty: number;
  discount: number;
  total_paid: number;
  payment_method: string;
  payment_date: string;
  bank_account_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export function usePaymentRecords(entityType?: 'receivable' | 'payable', entityId?: string) {
  return useQuery({
    queryKey: ['payment_records', entityType, entityId],
    queryFn: async () => {
      let query = supabase.from('payment_records').select('*').order('payment_date', { ascending: false });
      if (entityType === 'receivable' && entityId) query = query.eq('receivable_id', entityId);
      if (entityType === 'payable' && entityId) query = query.eq('payable_id', entityId);
      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentRecordRow[];
    },
  });
}

export function useCreatePaymentRecord() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (record: Omit<PaymentRecordRow, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('payment_records').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment_records'] });
      qc.invalidateQueries({ queryKey: ['accounts_receivable'] });
      qc.invalidateQueries({ queryKey: ['accounts_payable'] });
      toast({ title: 'Sucesso', description: 'Baixa registrada com sucesso' });
    },
    onError: () => { toast({ title: 'Erro', description: 'Erro ao registrar baixa', variant: 'destructive' }); },
  });
}
