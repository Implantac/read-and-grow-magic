import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QK, useCompanyId } from './_shared';

export function useClientNPSHistory(clientId?: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.clientHistory(companyId, clientId ?? undefined),
    enabled: !!companyId && !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_answers').select('*, nps_campaigns(name)').eq('company_id', companyId!).eq('client_id', clientId!).order('responded_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useClientNPSSummary(clientId?: string | null) {
  const { data: history } = useClientNPSHistory(clientId);
  const rows = history ?? [];
  const total = rows.length;
  const last = rows[0];
  const avg = total ? rows.reduce((s, r) => s + (r.score ?? 0), 0) / total : 0;
  const promoters = rows.filter((r) => r.category === 'promoter').length;
  const detractors = rows.filter((r) => r.category === 'detractor').length;
  const score = total ? Math.round(((promoters - detractors) / total) * 100) : 0;
  return { rows, total, last, avg, score };
}
