import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Playbook {
  id: string;
  stage: string;
  title: string;
  category: string;
  scripts: string[];
  actions: string[];
  next_steps: string[];
  tips: string | null;
  closing_techniques: string[];
  ideal_timing: string | null;
  priority: number;
  active: boolean;
}

export interface Objection {
  id: string;
  objection: string;
  category: string;
  response: string;
  strategy: string | null;
  context: string | null;
  stage: string | null;
  success_rate: number;
  usage_count: number;
}

export function usePlaybooks(stage?: string) {
  return useQuery({
    queryKey: ['playbooks', stage],
    queryFn: async () => {
      let q = supabase.from('sales_playbooks').select('*').eq('active', true).order('priority', { ascending: false });
      if (stage) q = q.eq('stage', stage);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        ...d,
        scripts: Array.isArray(d.scripts) ? d.scripts : [],
        actions: Array.isArray(d.actions) ? d.actions : [],
        next_steps: Array.isArray(d.next_steps) ? d.next_steps : [],
        closing_techniques: Array.isArray(d.closing_techniques) ? d.closing_techniques : [],
      })) as Playbook[];
    },
  });
}

export function useObjections(stage?: string, category?: string) {
  return useQuery({
    queryKey: ['objections', stage, category],
    queryFn: async () => {
      let q = supabase.from('sales_objections').select('*').eq('active', true);
      if (stage) q = q.eq('stage', stage);
      if (category) q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Objection[];
    },
  });
}

export function useLogPlaybookUsage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: { playbook_id?: string; objection_id?: string; action_type: string; context?: string; result?: string }) => {
      const { error } = await supabase.from('playbook_usage_logs').insert(log);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playbook_usage'] }),
  });
}

export function usePlaybookAdherence() {
  return useQuery({
    queryKey: ['playbook_usage', 'adherence'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playbook_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}
