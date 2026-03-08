import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AccountPayableRow {
  id: string;
  description: string;
  supplier: string;
  category: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: string;
  payment_method: string | null;
  notes: string | null;
  invoice_number: string | null;
  created_at: string;
  updated_at: string;
}

export function useAccountsPayable() {
  return useQuery({
    queryKey: ['accounts_payable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*')
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as AccountPayableRow[];
    },
  });
}

export function useCreateAccountPayable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (account: Omit<AccountPayableRow, 'id' | 'created_at' | 'updated_at' | 'payment_date' | 'payment_method' | 'status'> & { status?: string }) => {
      const { data, error } = await supabase
        .from('accounts_payable')
        .insert(account)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_payable'] });
      toast({ title: 'Sucesso', description: 'Conta a pagar cadastrada com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao cadastrar conta a pagar', variant: 'destructive' });
    },
  });
}

export function useUpdateAccountPayable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<AccountPayableRow>) => {
      const { data, error } = await supabase
        .from('accounts_payable')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_payable'] });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar conta', variant: 'destructive' });
    },
  });
}

export function useDeleteAccountPayable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts_payable').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_payable'] });
      toast({ title: 'Sucesso', description: 'Conta removida com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao remover conta', variant: 'destructive' });
    },
  });
}
