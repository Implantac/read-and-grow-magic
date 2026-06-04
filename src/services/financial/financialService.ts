import { supabase } from '@/integrations/supabase/client';
import { AccountReceivableRow } from '@/hooks/financial/useAccountsReceivable';
import { AccountPayableRow } from '@/hooks/financial/useAccountsPayable';

export const financialService = {
  async getReceivables() {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data as AccountReceivableRow[];
  },

  async createReceivable(account: Partial<AccountReceivableRow>) {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .insert(account)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateReceivable(id: string, updates: Partial<AccountReceivableRow>) {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteReceivable(id: string) {
    const { error } = await supabase.from('accounts_receivable').delete().eq('id', id);
    if (error) throw error;
  },

  async getPayables() {
    const { data, error } = await supabase
      .from('accounts_payable')
      .select('*')
      .order('due_date', { ascending: true });
    if (error) throw error;
    return data as AccountPayableRow[];
  },

  async createPayable(account: Partial<AccountPayableRow>) {
    const { data, error } = await supabase
      .from('accounts_payable')
      .insert(account)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePayable(id: string, updates: Partial<AccountPayableRow>) {
    const { data, error } = await supabase
      .from('accounts_payable')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePayable(id: string) {
    const { error } = await supabase.from('accounts_payable').delete().eq('id', id);
    if (error) throw error;
  }
};
