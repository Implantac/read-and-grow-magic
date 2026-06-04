import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toastError, toastSuccess } from '@/lib/toastHelpers';

export interface RenegotiationRow {
  id: string;
  client_id: string;
  client_name: string;
  original_total: number;
  new_total: number;
  interest_rate: number;
  installments: number;
  first_due_date: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useRenegotiations() {
  return useQuery({
    queryKey: ['renegotiations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('renegotiations').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as RenegotiationRow[];
    },
  });
}

export function useCreateRenegotiation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (neg: Omit<RenegotiationRow, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('renegotiations').insert(neg).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['renegotiations'] });
      qc.invalidateQueries({ queryKey: ['accounts_receivable'] });
      toastSuccess('Sucesso', 'Renegociação criada com sucesso');
    },
    onError: () => toastError('Erro ao criar renegociação'),
  });
}
