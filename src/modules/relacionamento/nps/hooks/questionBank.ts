import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCompanyId } from './_shared';

export function useQuestionBank(params?: { category?: string; search?: string }) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['nps', 'question-bank', companyId, params?.category ?? null, params?.search ?? null],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase
        .from('nps_question_bank' as any)
        .select('*')
        .or(`is_global.eq.true,company_id.eq.${companyId}`)
        .order('is_global', { ascending: false })
        .order('category')
        .order('usage_count', { ascending: false })
        .limit(500);
      if (params?.category) q = q.eq('category', params.category);
      if (params?.search) q = q.ilike('question_text', `%${params.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });
}

export function useSaveQuestionToBank() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (input: { category: string; question_text: string; question_type: string; options?: any; required?: boolean; tags?: string[]; id?: string }) => {
      if (input.id) {
        const { error } = await (supabase.from('nps_question_bank' as any) as any).update(input).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('nps_question_bank' as any) as any).insert({ ...input, company_id: companyId, is_global: false });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps', 'question-bank'] }); toast.success('Pergunta salva na biblioteca'); },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao salvar'),
  });
}

export function useDeleteQuestionFromBank() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('nps_question_bank' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps', 'question-bank'] }); toast.success('Removida'); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useImportQuestionsFromBank() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async ({ campaign_id, bank_ids, start_order }: { campaign_id: string; bank_ids: string[]; start_order: number }) => {
      const { data: bank, error } = await supabase
        .from('nps_question_bank' as any)
        .select('question_text,question_type,options,required')
        .in('id', bank_ids);
      if (error) throw error;
      const rows = (bank as any[] ?? []).map((b, i) => ({
        company_id: companyId,
        campaign_id,
        question_text: b.question_text,
        question_type: b.question_type,
        options: b.options,
        required: b.required,
        order_index: start_order + i,
      }));
      if (rows.length === 0) return;
      const { error: insErr } = await supabase.from('nps_questions').insert(rows as any);
      if (insErr) throw insErr;
      await (supabase.rpc as any)('increment_nps_bank_usage', { p_ids: bank_ids }).catch(() => {});
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success(`${vars.bank_ids.length} pergunta(s) importada(s)`); },
    onError: (e: any) => toast.error(e.message),
  });
}
