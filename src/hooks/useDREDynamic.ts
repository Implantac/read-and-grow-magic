import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DREDynamicRow {
  section: string;
  category_id: string | null;
  category_name: string;
  total: number;
}

export function useDREDynamic(params: { from: string; to: string; costCenterId?: string | null; channel?: string | null }) {
  return useQuery({
    queryKey: ['dre_dynamic', params],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dre_dynamic', {
        _from: params.from,
        _to: params.to,
        _cost_center_id: params.costCenterId ?? null,
        _channel: params.channel ?? null,
      });
      if (error) throw error;
      return (data ?? []) as DREDynamicRow[];
    },
  });
}
