import { supabase } from '@/integrations/supabase/client';
import { BaseService } from '../shared/baseService';
import type { AccountPayable, AccountReceivable } from '@/types/financial';

class FinancialService extends BaseService<'financial_ledger'> {
  constructor() {
    super('financial_ledger');
  }

  // Receivables
  async getReceivables(): Promise<AccountReceivable[]> {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .order('due_date', { ascending: true });
    if (error) throw error;
    return (data || []) as AccountReceivable[];
  }

  async createReceivable(account: Partial<AccountReceivable>): Promise<AccountReceivable> {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .insert(account as any)
      .select()
      .single();
    if (error) throw error;
    return data as AccountReceivable;
  }

  async updateReceivable(id: string, updates: Partial<AccountReceivable>): Promise<AccountReceivable> {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as AccountReceivable;
  }

  async deleteReceivable(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts_receivable')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Payables
  async getPayables(): Promise<AccountPayable[]> {
    const { data, error } = await supabase
      .from('accounts_payable')
      .select('*')
      .order('due_date', { ascending: true });
    if (error) throw error;
    return (data || []) as AccountPayable[];
  }

  async createPayable(account: Partial<AccountPayable>): Promise<AccountPayable> {
    const { data, error } = await supabase
      .from('accounts_payable')
      .insert(account as any)
      .select()
      .single();
    if (error) throw error;
    return data as AccountPayable;
  }

  async updatePayable(id: string, updates: Partial<AccountPayable>): Promise<AccountPayable> {
    const { data, error } = await supabase
      .from('accounts_payable')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as AccountPayable;
  }

  async deletePayable(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts_payable')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Ledger
  async getLedger(filters?: { from?: string; to?: string; bankAccountId?: string }): Promise<any[]> {
    let q = supabase.from('financial_ledger').select('*').order('entry_date', { ascending: false });
    if (filters?.from) q = q.gte('entry_date', filters.from);
    if (filters?.to) q = q.lte('entry_date', filters.to);
    if (filters?.bankAccountId) q = q.eq('bank_account_id', filters.bankAccountId);
    const { data, error } = await q.limit(1000);
    if (error) throw error;
    return (data || []) as any[];
  }

  // Payments
  async createPayment(payment: any): Promise<any> {
    const { data, error } = await supabase
      .from('payment_records')
      .insert(payment)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export const financialService = new FinancialService();
