import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export interface FollowUpTask {
  id: string;
  client_id: string | null;
  client_name: string;
  sales_rep_id: string | null;
  action_type: string;
  title: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  priority: string;
  channel: string | null;
  suggested_message: string | null;
  ai_generated: boolean;
  completed_at: string | null;
  result: string | null;
  order_id: string | null;
  funnel_id: string | null;
  created_at: string;
}

export function useFollowUpTasks(date?: string, status?: string) {
  return useQuery({
    queryKey: ['follow_up_tasks', date, status],
    queryFn: async () => {
      let q = supabase.from('follow_up_tasks').select('*').order('priority', { ascending: true }).order('scheduled_date', { ascending: true });
      if (date) q = q.eq('scheduled_date', date);
      if (status) q = q.eq('status', status);
      const { data, error } = await q.limit(100);
      if (error) throw error;
      return (data || []) as unknown as FollowUpTask[];
    },
  });
}

export function useCreateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<FollowUpTask>) => {
      const { error } = await supabase.from('follow_up_tasks').insert(task as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['follow_up_tasks'] });
      toastSuccess('Follow-up criado com sucesso');
    },
  });
}

export function useCompleteFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, result }: { id: string; result: string }) => {
      const { error } = await supabase.from('follow_up_tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString(), result } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follow_up_tasks'] }),
  });
}

export function useWhatsAppTemplates() {
  return useQuery({
    queryKey: ['whatsapp_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whatsapp_templates').select('*').eq('is_active', true).order('usage_count', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useNurturingSequences() {
  return useQuery({
    queryKey: ['lead_nurturing_sequences'],
    queryFn: async () => {
      const { data, error } = await supabase.from('lead_nurturing_sequences').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAISalesMessage() {
  return useMutation({
    mutationFn: async ({ action, context }: { action: string; context: any }) => {
      const { data, error } = await supabase.functions.invoke('ai-sales-message', {
        body: { action, context },
      });
      if (error) throw error;
      return data;
    },
    onError: (e: Error) => {
      const msg = e.message.includes('429') ? 'Limite de requisições excedido. Tente novamente.'
        : e.message.includes('402') ? 'Créditos insuficientes.'
        : e.message;
      toastError(msg, undefined, 'Erro na IA');
    },
  });
}
