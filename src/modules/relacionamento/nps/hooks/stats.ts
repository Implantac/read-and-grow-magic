import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { NPSStats } from '../types';
import { QK, useCompanyId } from './_shared';

export function useNPSStats() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.stats(companyId),
    enabled: !!companyId,
    queryFn: async (): Promise<NPSStats> => {
      const [{ data: answers }, { count: activeCount }, { count: invitesCount }, { count: respondedInvites }] = await Promise.all([
        supabase.from('nps_answers').select('score,category').eq('company_id', companyId!),
        supabase.from('nps_campaigns').select('*', { count: 'exact', head: true }).eq('company_id', companyId!).eq('status', 'active'),
        supabase.from('nps_invites').select('*', { count: 'exact', head: true }).eq('company_id', companyId!),
        supabase.from('nps_invites').select('*', { count: 'exact', head: true }).eq('company_id', companyId!).not('responded_at', 'is', null),
      ]);
      const rows = answers ?? [];
      const total = rows.length;
      const promoters = rows.filter((r) => r.category === 'promoter').length;
      const passives = rows.filter((r) => r.category === 'passive').length;
      const detractors = rows.filter((r) => r.category === 'detractor').length;
      const score = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
      const invitesTotal = invitesCount ?? 0;
      const responseRate = invitesTotal > 0 ? Math.min(100, Math.round(((respondedInvites ?? 0) / invitesTotal) * 100)) : 0;
      return {
        score, promoters, passives, detractors, total, responseRate,
        activeCampaigns: activeCount ?? 0,
      };
    },
  });
}
