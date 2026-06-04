import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export interface DbClient {
  id: string;
  code: string;
  name: string;
  trade_name: string | null;
  document: string;
  document_type: string;
  email: string;
  phone: string;
  cellphone: string | null;
  address_street: string;
  address_number: string;
  address_complement: string | null;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip_code: string;
  status: string;
  credit_limit: number;
  current_balance: number;
  segment: string | null;
  sales_rep_id: string | null;
  state_registration: string | null;
  municipal_registration: string | null;
  region: string | null;
  micro_region: string | null;
  default_payment_condition: string | null;
  price_table: string | null;
  abc_classification: string | null;
  commercial_notes: string | null;
  last_purchase_date: string | null;
  avg_ticket: number;
  estimated_potential: number;
  total_purchases: number;
  purchase_frequency: number;
  client_score: string;
  created_at: string;
  updated_at: string;
}

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true }); // Better default order for list
      if (error) throw error;
      return (data || []) as DbClient[];
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (client: Omit<DbClient, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('clients').insert(client as any).select().single();
      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      toastSuccess('Cliente cadastrado com sucesso!');
    },
    onError: handleMutationError,
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...client }: Partial<DbClient> & { id: string }) => {
      const { data, error } = await supabase.from('clients').update({ ...client, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      toastSuccess('Cliente atualizado com sucesso!');
    },
    onError: handleMutationError,
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      toastSuccess('Cliente excluído com sucesso!');
    },
    onError: handleMutationError,
  });
}
