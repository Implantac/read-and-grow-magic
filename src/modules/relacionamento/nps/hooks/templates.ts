import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { QK, useCompanyId } from './_shared';

export type NPSTemplateInput = Partial<TablesInsert<'nps_templates'>> & { id?: string };

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
    mutationFn: async (input: NPSTemplateInput) => {
      if (input.id) {
        const { id, ...patch } = input;
        const { error } = await supabase
          .from('nps_templates')
          .update(patch as TablesUpdate<'nps_templates'>)
          .eq('id', id)
          .eq('company_id', companyId!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nps_templates').insert({ ...input, company_id: companyId! } as TablesInsert<'nps_templates'>);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Template salvo'); },
    onError: (e: Error) => toast.error(e.message),
  });
}
