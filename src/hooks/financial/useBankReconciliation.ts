import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BankTransactionRow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  bank_reference: string | null;
  status: string;
  matched_entry_id: string | null;
  created_at: string;
}

export function useBankTransactions() {
  const [transactions, setTransactions] = useState<BankTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('bank_transactions').select('*').order('date', { ascending: false });
    if (error) { console.error('Fetch transactions error:', error); toast.error('Erro ao carregar transações bancárias'); }
    else setTransactions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (id: string, updates: Partial<BankTransactionRow>) => {
    const { error } = await (supabase as any).from('bank_transactions').update(updates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar transação'); return; }
    await fetch();
  };

  return { transactions, loading, refetch: fetch, update };
}
