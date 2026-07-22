import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QK, useCompanyId } from './_shared';

export function useNPSAnswers(campaignId?: string | null, limit = 500) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.answers(companyId, campaignId),
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from('nps_answers').select('*, clients(name,address_city,segment), nps_answer_items(id, question_id, value_text, value_number, value_json, nps_questions(id, label, type))').eq('company_id', companyId!).order('responded_at', { ascending: false }).limit(limit);
      if (campaignId) q = q.eq('campaign_id', campaignId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}
