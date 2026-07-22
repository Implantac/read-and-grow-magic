import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from './_shared';

export function useNPSLogs(filter?: { level?: string; event?: string }) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['nps', 'logs', companyId, filter?.level ?? 'all', filter?.event ?? ''],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from('nps_logs').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }).limit(500);
      if (filter?.level && filter.level !== 'all') q = q.eq('level', filter.level);
      if (filter?.event) q = q.ilike('event', `%${filter.event}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}
