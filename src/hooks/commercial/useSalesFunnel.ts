import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export const FUNNEL_STAGES = [
  { value: 'lead', label: 'Lead', color: 'bg-slate-500' },
  { value: 'opportunity', label: 'Oportunidade', color: 'bg-blue-500' },
  { value: 'proposal_sent', label: 'Proposta Enviada', color: 'bg-indigo-500' },
  { value: 'negotiation', label: 'Negociação', color: 'bg-purple-500' },
  { value: 'awaiting_approval', label: 'Aguardando Aprovação', color: 'bg-amber-500' },
  { value: 'approved', label: 'Pedido Aprovado', color: 'bg-emerald-500' },
  { value: 'released', label: 'Liberado', color: 'bg-green-500' },
  { value: 'separating', label: 'Em Separação', color: 'bg-teal-500' },
  { value: 'production', label: 'Em Produção', color: 'bg-cyan-500' },
  { value: 'invoiced', label: 'Faturado', color: 'bg-sky-500' },
  { value: 'delivered', label: 'Entregue', color: 'bg-green-600' },
  { value: 'post_sale', label: 'Pós-Venda', color: 'bg-gray-500' },
] as const;

export interface DbFunnelItem {
  id: string;
  client_id: string | null;
  sales_rep_id: string | null;
  title: string;
  description: string | null;
  stage: string;
  value: number;
  probability: number;
  expected_close_date: string | null;
  won_date: string | null;
  lost_date: string | null;
  lost_reason: string | null;
  source: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  status: string;
  order_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useSalesFunnel(stage?: string) {
  return useQuery({
    queryKey: ['sales_funnel', stage],
    queryFn: async () => {
      let query = supabase.from('sales_funnel').select('*').order('created_at', { ascending: false });
      if (stage) query = query.eq('stage', stage);
      const { data, error } = await query;
      if (error) throw error;
      return data as DbFunnelItem[];
    },
  });
}

export function useCreateFunnelItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase.from('sales_funnel').insert(item as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales_funnel'] });
      toastSuccess('Oportunidade criada');
    },
    onError: handleMutationError,
  });
}

export function useUpdateFunnelItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any & { id: string }) => {
      const { data, error } = await supabase.from('sales_funnel').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales_funnel'] }),
  });
}

export function useDeleteFunnelItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales_funnel').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales_funnel'] });
      toastSuccess('Oportunidade removida');
    },
    onError: handleMutationError,
  });
}
