import { supabase } from '@/integrations/supabase/client';
import { AccountReceivable, AccountPayable } from '@/types/financial';
import { BaseService } from '../shared/baseService';

class FinancialService {
  private receivablesBase = new BaseService<AccountReceivable>('accounts_receivable');
  private payablesBase = new BaseService<AccountPayable>('accounts_payable');

  async getReceivables() {
    return this.receivablesBase.getAll({ orderBy: 'due_date', ascending: true });
  }

  async createReceivable(account: Partial<AccountReceivable>) {
    return this.receivablesBase.create(account as any);
  }

  async updateReceivable(id: string, updates: Partial<AccountReceivable>) {
    return this.receivablesBase.update(id, updates);
  }

  async deleteReceivable(id: string) {
    return this.receivablesBase.delete(id);
  }

  async getPayables() {
    return this.payablesBase.getAll({ orderBy: 'due_date', ascending: true });
  }

  async createPayable(account: Partial<AccountPayable>) {
    return this.payablesBase.create(account as any);
  }

  async updatePayable(id: string, updates: Partial<AccountPayable>) {
    return this.payablesBase.update(id, updates);
  }

  async deletePayable(id: string) {
    return this.payablesBase.delete(id);
  }
}

export const financialService = new FinancialService();
