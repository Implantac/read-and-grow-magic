import { BaseService } from '../shared/baseService';

class FinancialService {
  private receivablesBase = new BaseService('accounts_receivable');
  private payablesBase = new BaseService('accounts_payable');

  async getReceivables() {
    return this.receivablesBase.getAll({ orderBy: 'due_date', ascending: true });
  }

  async createReceivable(account: any) {
    return this.receivablesBase.create(account);
  }

  async updateReceivable(id: string, updates: any) {
    return this.receivablesBase.update(id, updates);
  }

  async deleteReceivable(id: string) {
    return this.receivablesBase.delete(id);
  }

  async getPayables() {
    return this.payablesBase.getAll({ orderBy: 'due_date', ascending: true });
  }

  async createPayable(account: any) {
    return this.payablesBase.create(account);
  }

  async updatePayable(id: string, updates: any) {
    return this.payablesBase.update(id, updates);
  }

  async deletePayable(id: string) {
    return this.payablesBase.delete(id);
  }
}

export const financialService = new FinancialService();
