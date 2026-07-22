import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QK, useCompanyId } from './_shared';

export function useNPSTemplates() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.templates(companyId),
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_templates').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (input: any) => {
      if (input.id) {
        const { error } = await supabase.from('nps_templates').update(input as any).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nps_templates').insert({ ...input, company_id: companyId! } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Template salvo'); },
    onError: (e: any) => toast.error(e.message),
  });
}
