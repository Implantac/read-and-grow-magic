import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from './_shared';

type AnswerItemRow = {
  value_number: number | null;
  created_at: string;
  nps_questions: { question_type: string | null } | null;
};

export function useCSATCESMetrics() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['nps', 'csat-ces', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nps_answer_items')
        .select('value_number,created_at,nps_questions!inner(question_type)')
        .eq('company_id', companyId!)
        .in('nps_questions.question_type', ['csat', 'ces'])
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      const rows = (data ?? []) as unknown as AnswerItemRow[];
      const csat = rows.filter((r) => r.nps_questions?.question_type === 'csat');
      const ces = rows.filter((r) => r.nps_questions?.question_type === 'ces');
      const avg = (arr: AnswerItemRow[]) => arr.length ? arr.reduce((s, r) => s + (r.value_number ?? 0), 0) / arr.length : 0;
      return {
        csat: {
          total: csat.length,
          media: Number(avg(csat).toFixed(2)),
          satisfeitosPct: csat.length ? Math.round(csat.filter((r) => (r.value_number ?? 0) >= 4).length / csat.length * 100) : 0,
        },
        ces: {
          total: ces.length,
          media: Number(avg(ces).toFixed(2)),
          baixoEsforcoPct: ces.length ? Math.round(ces.filter((r) => (r.value_number ?? 0) <= 3).length / ces.length * 100) : 0,
        },
      };
    },
  });
}
