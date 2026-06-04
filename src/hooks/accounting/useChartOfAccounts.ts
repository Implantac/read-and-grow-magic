import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ChartOfAccount } from '@/types/accounting';
import { toast } from 'sonner';

export function useChartOfAccounts() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .order('code');

      if (error) throw error;

      const mapped: ChartOfAccount[] = (data || []).map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        type: row.type as ChartOfAccount['type'],
        nature: row.nature as ChartOfAccount['nature'],
        parentId: row.parent_id,
        level: row.level,
        isAnalytical: row.is_analytical,
        balance: Number(row.balance),
        active: row.active,
      }));

      setAccounts(mapped);
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      toast.error('Erro ao carregar plano de contas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (account: Omit<ChartOfAccount, 'id'>) => {
    try {
      const { error } = await supabase.from('chart_of_accounts').insert({
        code: account.code,
        name: account.name,
        type: account.type,
        nature: account.nature,
        parent_id: account.parentId,
        level: account.level,
        is_analytical: account.isAnalytical,
        balance: account.balance,
        active: account.active,
      });
      if (error) throw error;
      toast.success('Conta criada com sucesso');
      await fetchAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      toast.error('Erro ao criar conta');
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      const { error } = await supabase.from('chart_of_accounts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Conta excluída com sucesso');
      await fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Erro ao excluir conta');
    }
  };

  return { accounts, loading, refetch: fetchAccounts, createAccount, deleteAccount };
}
