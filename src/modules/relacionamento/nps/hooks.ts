import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { toast } from 'sonner';
import type { NPSStats } from './types';

const QK = {
  stats: (cid?: string) => ['nps', 'stats', cid],
  campaigns: (cid?: string) => ['nps', 'campaigns', cid],
  answers: (cid?: string, campaignId?: string | null) => ['nps', 'answers', cid, campaignId],
  invites: (cid?: string) => ['nps', 'invites', cid],
  templates: (cid?: string) => ['nps', 'templates', cid],
  automations: (cid?: string) => ['nps', 'automations', cid],
  webhooks: (cid?: string) => ['nps', 'webhooks', cid],
  questions: (cid?: string, cpn?: string) => ['nps', 'questions', cid, cpn],
  clientHistory: (cid?: string, cliId?: string) => ['nps', 'client-history', cid, cliId],
};

function useCompanyId() {
  const { currentCompany } = useEnterprise() as any;
  return currentCompany?.id as string | undefined;
}

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
      // Taxa = respostas atribuídas a convites / convites enviados. Respostas espontâneas (sem convite) não distorcem o denominador.
      const invitesTotal = invitesCount ?? 0;
      const responseRate = invitesTotal > 0 ? Math.min(100, Math.round(((respondedInvites ?? 0) / invitesTotal) * 100)) : 0;
      return {
        score, promoters, passives, detractors, total, responseRate,
        activeCampaigns: activeCount ?? 0,
      };
    },
  });
}

export function useNPSCampaigns() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.campaigns(companyId),
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_campaigns').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (input: Partial<any> & { name: string }) => {
      const { data, error } = await supabase.from('nps_campaigns').insert({ ...input, company_id: companyId! } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nps'] });
      toast.success('Campanha criada');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erro ao criar campanha'),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from('nps_campaigns').update(patch as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nps'] }),
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nps_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Campanha removida'); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useNPSAnswers(campaignId?: string | null, limit = 500) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.answers(companyId, campaignId),
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from('nps_answers').select('*, clients(name,address_city,segment)').eq('company_id', companyId!).order('responded_at', { ascending: false }).limit(limit);
      if (campaignId) q = q.eq('campaign_id', campaignId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNPSInvites(campaignId?: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: [...QK.invites(companyId), campaignId],
    enabled: !!companyId,
    queryFn: async () => {
      let q = supabase.from('nps_invites').select('*, clients(name), nps_campaigns(name)').eq('company_id', companyId!).order('created_at', { ascending: false }).limit(500);
      if (campaignId) q = q.eq('campaign_id', campaignId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGenerateInvites() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { campaign_id: string; client_ids: string[]; channel?: string; expires_in_days?: number }) => {
      const { data, error } = await supabase.functions.invoke('nps-generate-invites', { body: payload });
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => {
      qc.invalidateQueries({ queryKey: ['nps'] });
      toast.success(`${d?.invites?.length ?? 0} convite(s) gerados`);
    },
    onError: (e: any) => toast.error(e.message),
  });
}

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

export function useNPSAutomations() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.automations(companyId),
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_automations').select('*, nps_campaigns(name)').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveAutomation() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (input: any) => {
      if (input.id) {
        const { error } = await supabase.from('nps_automations').update(input as any).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nps_automations').insert({ ...input, company_id: companyId! } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Automação salva'); },
    onError: (e: any) => toast.error(e.message),
  });
}

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
    mutationFn: async (input: any) => {
      if (input.id) {
        const { error } = await supabase.from('nps_webhooks').update(input as any).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('nps_webhooks').insert({ ...input, company_id: companyId! } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success('Webhook salvo'); },
    onError: (e: any) => toast.error(e.message),
  });
}

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

export function useClientNPSHistory(clientId?: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: QK.clientHistory(companyId, clientId ?? undefined),
    enabled: !!companyId && !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase.from('nps_answers').select('*, nps_campaigns(name)').eq('company_id', companyId!).eq('client_id', clientId!).order('responded_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useClientNPSSummary(clientId?: string | null) {
  const { data: history } = useClientNPSHistory(clientId);
  const rows = history ?? [];
  const total = rows.length;
  const last = rows[0];
  const avg = total ? rows.reduce((s, r) => s + (r.score ?? 0), 0) / total : 0;
  const promoters = rows.filter((r) => r.category === 'promoter').length;
  const detractors = rows.filter((r) => r.category === 'detractor').length;
  const score = total ? Math.round(((promoters - detractors) / total) * 100) : 0;
  return { rows, total, last, avg, score };
}

export function publicSurveyUrl(token: string) {
  return `${window.location.origin}/nps/${token}`;
}

// ============ Banco de Perguntas ============
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
      // Incrementa usage_count
      await (supabase.rpc as any)('increment_nps_bank_usage', { p_ids: bank_ids }).catch(() => {});
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['nps'] }); toast.success(`${vars.bank_ids.length} pergunta(s) importada(s)`); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useNPSTokenForInvite(inviteId?: string | null) {
  return useQuery({
    queryKey: ['nps', 'token-for-invite', inviteId],
    enabled: !!inviteId,
    queryFn: async () => {
      const { data } = await supabase.from('nps_tokens').select('token').eq('invite_id', inviteId!).maybeSingle();
      return data?.token as string | undefined;
    },
  });
}

// ============ Follow-ups (detratores) ============
export function useNPSFollowups(status?: string) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['nps', 'followups', companyId, status ?? 'all'],
    enabled: !!companyId,
    queryFn: async () => {
      let q = (supabase.from('nps_followups' as any) as any)
        .select('*, clients(name,email,phone,address_city), nps_campaigns(name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (status && status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });
}

export function useUpdateFollowup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Record<string, any>) => {
      const { error } = await (supabase.from('nps_followups' as any) as any).update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nps', 'followups'] }); toast.success('Follow-up atualizado'); },
    onError: (e: any) => toast.error(e.message),
  });
}

// ============ Logs ============
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

// ============ Reorder questions ============
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

// ============ CSAT / CES ============
export function useCSATCESMetrics() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['nps', 'csat-ces', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nps_answer_items')
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


