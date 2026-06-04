import { useSupabaseQuery } from '@/hooks/shared/useSupabaseQuery';
import { accountingService } from '@/services/accounting/accountingService';

export function useAccountingDashboardData() {
  return useSupabaseQuery(
    ['accounting_dashboard'], 
    () => accountingService.getDashboardData()
  );
}
