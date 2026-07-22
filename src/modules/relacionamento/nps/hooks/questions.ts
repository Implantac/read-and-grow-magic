import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QK, useCompanyId } from './_shared';

export function useNPSQuestions(campaignId?: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.questions(companyId, campaignId ?? undefined),
    enabled: !!companyId && !!campaignId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_questions').select('*').eq('company_id', companyId!).eq('campaign_id', campaignId!).order('order_index');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useReorderQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, order_index }: { id: string; order_index: number }) => {
      const { error } = await supabase.from('nps_questions').update({ order_index }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nps'] }),
    onError: (e: any) => toast.error(e.message),
  });
}
