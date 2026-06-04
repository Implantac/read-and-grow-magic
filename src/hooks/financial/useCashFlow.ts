import { cashFlowService } from '@/services/financial/cashFlowService';
import { useSupabaseQuery } from '@/hooks/shared/useSupabaseQuery';

export interface CashFlowRow {
  id: string;
  date: string;
  description: string;
  type: string;
  category: string;
  amount: number;
  balance: number;
  reference: string | null;
  account: string;
  created_at: string;
}

export function useCashFlowEntries() {
  return useSupabaseQuery(['cash_flow_entries'], () => cashFlowService.getAll());
}
