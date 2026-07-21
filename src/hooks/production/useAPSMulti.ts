import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface APSAssignment {
  order_id: string;
  order_number: string;
  product_name: string;
  quantity: number;
  due_date: string | null;
  priority: string | null;
  machine_id: string | null;
  machine_name: string | null;
  machine_sector: string | null;
  operator: string | null;
  duration_minutes: number;
  planned_start: string | null;
  planned_end: string | null;
  is_late: boolean;
  conflicts: string[];
  sequence_no: number;
}

export function useAPSMulti(horizonDays = 14) {
  return useQuery({
    queryKey: ['aps-multi', horizonDays],
    queryFn: async (): Promise<APSAssignment[]> => {
      const { data, error } = await supabase.rpc('aps_schedule_multi', {
        _horizon_days: horizonDays,
      });
      if (error) throw error;
      return (data || []) as APSAssignment[];
    },
    staleTime: 30_000,
  });
}
