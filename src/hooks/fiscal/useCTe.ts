import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface CTe {
  id: string;
  number: string;
  series: string;
  access_key: string | null;
  protocol: string | null;
  issue_date: string;
  authorization_date: string | null;
  cancellation_date: string | null;
  cancellation_reason: string | null;
  status: 'draft' | 'pending' | 'authorized' | 'cancelled' | 'rejected';
  cte_type: string;
  modal: string;
  service_type: string;
  carrier_id: string | null;
  carrier_name: string;
  carrier_document: string | null;
  sender_name: string;
  sender_document: string | null;
  sender_uf: string | null;
  recipient_name: string;
  recipient_document: string | null;
  recipient_uf: string | null;
  origin_city: string | null;
  destination_city: string | null;
  cargo_value: number;
  freight_value: number;
  icms_base: number;
  icms_rate: number;
  icms_value: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCTes() {
  return useQuery({
    queryKey: ['ctes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cte').select('*').order('issue_date', { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as CTe[];
    },
  });
}

export function useCreateCTe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CTe> & { carrier_name: string; sender_name: string; recipient_name: string }) => {
      const number = 'CTE-' + Date.now().toString().slice(-8);
      const icms_base = payload.freight_value ?? 0;
      const icms_rate = payload.icms_rate ?? 12;
      const icms_value = (icms_base * icms_rate) / 100;
      const total = (payload.freight_value ?? 0);
      const { data, error } = await supabase
        .from('cte')
        .insert({ ...payload, number, icms_base, icms_rate, icms_value, total, status: 'draft' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ctes'] });
      toastSuccess('CT-e criado', 'Rascunho registrado com sucesso.');
    },
    onError: handleMutationError,
  });
}

export function useTransmitCTe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      throw new Error('Transmissão de CT-e indisponível sem retorno oficial da SEFAZ.');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ctes'] });
      toastSuccess('CT-e transmitido');
    },
    onError: handleMutationError,
  });
}

export function useCancelCTe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      throw new Error('Cancelamento de CT-e indisponível sem confirmação oficial da SEFAZ.');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ctes'] });
      toastSuccess('CT-e cancelado');
    },
    onError: handleMutationError,
  });
}
