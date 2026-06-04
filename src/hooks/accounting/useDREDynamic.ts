import { dreService } from '@/services/accounting/dreService';
import { useSupabaseQuery } from '@/hooks/shared/useSupabaseQuery';

export interface DREDynamicRow {
  section: string;
  category_id: string | null;
  category_name: string;
  total: number;
}

export function useDREDynamic(params: { from: string; to: string; costCenterId?: string | null; channel?: string | null }) {
  return useSupabaseQuery(
    ['dre_dynamic', params], 
    () => dreService.getDynamic(params)
  );
}
