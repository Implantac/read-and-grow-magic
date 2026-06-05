import { supabase } from '@/integrations/supabase/client';
import { ChartOfAccount, JournalEntry, BalanceSheetItem, DREItem } from '@/types/accounting';

export class AccountingService {
  private readonly supabase = supabase;

  // Chart of Accounts
  async getChartOfAccounts(): Promise<ChartOfAccount[]> {
    const { data, error } = await this.supabase
      .from('chart_of_accounts')
      .select('*')
      .order('code');

    if (error) throw error;

    return (data || []).map((row) => ({
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
  }

  async createAccount(account: Omit<ChartOfAccount, 'id'>): Promise<void> {
    const { error } = await this.supabase.from('chart_of_accounts').insert({
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
  }

  async deleteAccount(id: string): Promise<void> {
    const { error } = await this.supabase.from('chart_of_accounts').delete().eq('id', id);
    if (error) throw error;
  }

  // Journal Entries
  async getJournalEntries(): Promise<JournalEntry[]> {
    const { data, error } = await this.supabase
      .from('journal_entries')
      .select(`
        *,
        lines:journal_entry_lines(*)
      `)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      number: row.number,
      date: row.date,
      description: row.description,
      status: row.status as JournalEntry['status'],
      totalDebit: Number(row.total_debit),
      totalCredit: Number(row.total_credit),
      createdBy: row.created_by,
      createdAt: row.created_at,
      lines: row.lines.map((l: any) => ({
        id: l.id,
        accountId: l.account_id,
        accountCode: l.account_code,
        accountName: l.account_name,
        description: l.description,
        debit: Number(l.debit),
        credit: Number(l.credit)
      }))
    }));
  }

  async postJournalEntry(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('journal_entries')
      .update({ status: 'posted' })
      .eq('id', id);
    
    if (error) throw error;
  }

  // Reports
  async getBalanceSheet(): Promise<BalanceSheetItem[]> {
    const { data, error } = await this.supabase
      .from('accounting_reports')
      .select('*')
      .eq('report_type', 'balance_sheet')
      .order('code');

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      code: row.code,
      description: row.description,
      currentPeriod: Number(row.current_period),
      previousPeriod: Number(row.previous_period),
      level: row.level,
      isTotal: row.is_total,
      section: row.section as BalanceSheetItem['section']
    }));
  }

  async getDRE(): Promise<DREItem[]> {
    const { data, error } = await this.supabase
      .from('accounting_reports')
      .select('*')
      .eq('report_type', 'dre')
      .order('order_index');

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      code: row.code,
      description: row.description,
      currentPeriod: Number(row.current_period),
      previousPeriod: Number(row.previous_period),
      variation: Number(row.variation),
      level: row.level,
      isTotal: row.is_total
    }));
  }

  async getDashboardData(): Promise<any> {
    const { data, error } = await this.supabase
      .from('accounting_dashboard_stats')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }
}

export const accountingService = new AccountingService();

