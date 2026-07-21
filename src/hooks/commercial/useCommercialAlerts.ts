import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toastSuccess } from '@/lib/toastHelpers';

export interface DbCommercialAlert {
  id: string;
  alert_type: string;
  client_id: string | null;
  order_id: string | null;
  sales_rep_id: string | null;
  funnel_id: string | null;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export function useCommercialAlerts(status?: string) {
  return useQuery({
    queryKey: ['commercial_alerts', status],
    queryFn: async () => {
      let query = supabase.from('commercial_alerts').select('*').order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return data as DbCommercialAlert[];
    },
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resolved_by }: { id: string; resolved_by: string }) => {
      const { error } = await supabase
        .from('commercial_alerts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commercial_alerts'] });
      toastSuccess('Alerta resolvido');
    },
  });
}
