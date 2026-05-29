import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toastSuccess } from '@/lib/toastHelpers';

export interface AccountReceivableRow {
  id: string;
  description: string;
  client_name: string;
  client_id: string | null;
  category: string;
  amount: number;
  original_amount: number | null;
  open_amount: number | null;
  paid_amount: number | null;
  interest: number | null;
  penalty: number | null;
  discount_amount: number | null;
  due_date: string;
  issue_date: string | null;
  payment_date: string | null;
  status: string;
  payment_method: string | null;
  notes: string | null;
  invoice_number: string | null;
  nfe_id: string | null;
  order_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
  created_at: string;
  updated_at: string;
}

export function useAccountsReceivable() {
  return useQuery({
    queryKey: ['accounts_receivable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as AccountReceivableRow[];
    },
  });
}

export function useCreateAccountReceivable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (account: Partial<AccountReceivableRow> & { description: string; client_name: string; due_date: string; amount: number }) => {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .insert(account)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] });
      toastSuccess('Sucesso', 'Conta a receber cadastrada com sucesso');
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao cadastrar conta a receber', variant: 'destructive' });
    },
  });
}

export function useUpdateAccountReceivable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<AccountReceivableRow>) => {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar conta', variant: 'destructive' });
    },
  });
}

export function useDeleteAccountReceivable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts_receivable').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_receivable'] });
      toastSuccess('Sucesso', 'Conta removida com sucesso');
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao remover conta', variant: 'destructive' });
    },
  });
}
