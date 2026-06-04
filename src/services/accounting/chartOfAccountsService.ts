import { supabase } from '@/integrations/supabase/client';
import { ChartOfAccount } from '@/types/accounting';

export const chartOfAccountsService = {
  async getAll() {
    const { data, error } = await supabase
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
  },

  async create(account: Omit<ChartOfAccount, 'id'>) {
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
  },

  async delete(id: string) {
    const { error } = await supabase.from('chart_of_accounts').delete().eq('id', id);
    if (error) throw error;
  }
};
