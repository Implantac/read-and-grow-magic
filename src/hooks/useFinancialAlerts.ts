import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialAlertRow {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export function useFinancialAlerts() {
  return useQuery({
    queryKey: ['financial_alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as FinancialAlertRow[];
    },
  });
}
