import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mutationErrorHandler, toastSuccess } from '@/lib/toastHelpers';

export function useCommissionPolicies() {
  return useQuery({
    queryKey: ['commission-policies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_policies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCommissions(filters?: { period?: string; status?: string; salesRepId?: string }) {
  return useQuery({
    queryKey: ['commissions', filters],
    queryFn: async () => {
      let query = supabase.from('commissions').select('*').order('created_at', { ascending: false });
      if (filters?.period) query = query.eq('period', filters.period);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.salesRepId) query = query.eq('sales_rep_id', filters.salesRepId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCommissionPayments(period?: string) {
  return useQuery({
    queryKey: ['commission-payments', period],
    queryFn: async () => {
      let query = supabase.from('commission_payments').select('*').order('created_at', { ascending: false });
      if (period) query = query.eq('period', period);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCommissionMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPolicy = useMutation({
    mutationFn: async (policy: any) => {
      const { data, error } = await supabase.from('commission_policies').insert(policy).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-policies'] });
      toastSuccess('Política criada com sucesso');
    },
    onError: mutationErrorHandler('Erro ao criar política'),
  });

  const updatePolicy = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase.from('commission_policies').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-policies'] });
      toastSuccess('Política atualizada');
    },
  });

  const updateCommissionStatus = useMutation({
    mutationFn: async ({ id, status, ...extra }: { id: string; status: string; [key: string]: any }) => {
      const { error } = await supabase.from('commissions').update({ status, ...extra, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toastSuccess('Comissão atualizada');
    },
  });

  return { createPolicy, updatePolicy, updateCommissionStatus };
}
