import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export interface LowMarginAlert {
  id: string;
  order_id: string | null;
  title: string;
  description: string | null;
  severity: string | null;
  status: string | null;
  created_at: string | null;
}

export function useLowMarginAlerts() {
  return useQuery({
    queryKey: ['commercial_alerts', 'low_margin', 'open'],
    queryFn: async (): Promise<LowMarginAlert[]> => {
      const { data, error } = await supabase
        .from('commercial_alerts')
        .select('id, order_id, title, description, severity, status, created_at')
        .eq('alert_type', 'low_margin')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as LowMarginAlert[];
    },
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commercial_alerts')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toastSuccess('Alerta resolvido');
      qc.invalidateQueries({ queryKey: ['commercial_alerts'] });
    },
    onError: (e: any) => toastError('Erro ao resolver alerta', e?.message),
  });
}
