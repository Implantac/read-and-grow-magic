import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from './_shared';

export function useCSATCESMetrics() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['nps', 'csat-ces', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('nps_answer_items' as any) as any)
        .select('question_type,score,created_at')
        .eq('company_id', companyId!)
        .in('question_type', ['csat', 'ces'])
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      const rows = (data as any[]) ?? [];
      const csat = rows.filter((r) => r.question_type === 'csat');
      const ces = rows.filter((r) => r.question_type === 'ces');
      const avg = (arr: any[]) => arr.length ? arr.reduce((s, r) => s + (r.score ?? 0), 0) / arr.length : 0;
      return {
        csat: {
          total: csat.length,
          media: Number(avg(csat).toFixed(2)),
          satisfeitosPct: csat.length ? Math.round(csat.filter((r) => (r.score ?? 0) >= 4).length / csat.length * 100) : 0,
        },
        ces: {
          total: ces.length,
          media: Number(avg(ces).toFixed(2)),
          baixoEsforcoPct: ces.length ? Math.round(ces.filter((r) => (r.score ?? 0) <= 3).length / ces.length * 100) : 0,
        },
      };
    },
  });
}
