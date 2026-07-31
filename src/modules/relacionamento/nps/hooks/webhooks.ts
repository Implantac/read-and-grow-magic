import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { QK, useCompanyId } from './_shared';

export type NPSWebhookInput = Partial<TablesInsert<'nps_webhooks'>> & { id?: string; url: string };

export function useNPSWebhooks() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.webhooks(companyId),
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_webhooks').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveWebhook() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (input: NPSWebhookInput) => {
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase.from('nps_webhooks').update(patch as TablesUpdate<'nps_webhooks'>).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nps_webhooks').insert({ ...input, company_id: companyId! } as TablesInsert<'nps_webhooks'>);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Webhook salvo'); },
    onError: (e: Error) => toast.error(e.message),
  });
}
