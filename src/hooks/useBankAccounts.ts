import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BankAccountRow {
  id: string;
  name: string;
  bank_name: string;
  bank_code: string | null;
  agency: string | null;
  account_number: string | null;
  account_type: string;
  balance: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBankAccounts() {
  return useQuery({
    queryKey: ['bank_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as BankAccountRow[];
    },
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (account: Partial<BankAccountRow>) => {
      const { data, error } = await supabase.from('bank_accounts').insert(account).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank_accounts'] }); toast({ title: 'Sucesso', description: 'Conta bancária cadastrada' }); },
    onError: () => { toast({ title: 'Erro', description: 'Erro ao cadastrar conta', variant: 'destructive' }); },
  });
}

export function useUpdateBankAccount() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<BankAccountRow>) => {
      const { data, error } = await supabase.from('bank_accounts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bank_accounts'] }); },
    onError: () => { toast({ title: 'Erro', description: 'Erro ao atualizar conta', variant: 'destructive' }); },
  });
}
