import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';

// ── Contact Logs ──
export interface ContactLog {
  id: string;
  sales_rep_id: string | null;
  client_id: string | null;
  funnel_id: string | null;
  contact_type: string;
  result: string;
  notes: string | null;
  duration_minutes: number;
  next_action: string | null;
  next_action_date: string | null;
  response_time_minutes: number | null;
  created_at: string;
}

export function useContactLogs(salesRepId?: string, dateFrom?: string) {
  return useQuery({
    queryKey: ['sales_contact_logs', salesRepId, dateFrom],
    queryFn: async () => {
      let q = supabase.from('sales_contact_logs').select('*').order('created_at', { ascending: false }).limit(500);
      if (salesRepId) q = q.eq('sales_rep_id', salesRepId);
      if (dateFrom) q = q.gte('created_at', dateFrom);
      const { data, error } = await q;
      if (error) throw error;
      return data as ContactLog[];
    },
  });
}

export function useCreateContactLog() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (log: Partial<ContactLog>) => {
      const { data, error } = await supabase.from('sales_contact_logs').insert(log as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales_contact_logs'] });
      qc.invalidateQueries({ queryKey: ['sales_daily_goals'] });
      toast({ title: 'Contato registrado' });
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });
}

// ── Daily Goals ──
export interface DailyGoal {
  id: string;
  sales_rep_id: string;
  goal_date: string;
  target_contacts: number;
  target_proposals: number;
  target_value: number;
  achieved_contacts: number;
  achieved_proposals: number;
  achieved_value: number;
  created_at: string;
  updated_at: string;
}

export function useDailyGoals(salesRepId?: string, date?: string) {
  return useQuery({
    queryKey: ['sales_daily_goals', salesRepId, date],
    queryFn: async () => {
      let q = supabase.from('sales_daily_goals').select('*').order('goal_date', { ascending: false });
      if (salesRepId) q = q.eq('sales_rep_id', salesRepId);
      if (date) q = q.eq('goal_date', date);
      const { data, error } = await q;
      if (error) throw error;
      return data as DailyGoal[];
    },
  });
}

export function useUpsertDailyGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (goal: Partial<DailyGoal>) => {
      const { data, error } = await supabase.from('sales_daily_goals').upsert(goal as any, { onConflict: 'sales_rep_id,goal_date' }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales_daily_goals'] }),
  });
}

// ── Smart Queue: priorities funnel items by urgency ──
export function useSmartSalesQueue() {
  const funnelQuery = useQuery({
    queryKey: ['sales_funnel_queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_funnel')
        .select('*')
        .in('status', ['active', 'open'])
        .order('updated_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const contactsQuery = useQuery({
    queryKey: ['sales_contact_logs_recent'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data, error } = await supabase
        .from('sales_contact_logs')
        .select('funnel_id, created_at, next_action_date')
        .gte('created_at', sevenDaysAgo);
      if (error) throw error;
      return data;
    },
  });

  const queue = useMemo(() => {
    if (!funnelQuery.data) return [];
    const contactsByFunnel = new Map<string, { lastContact: string; hasNextAction: boolean; nextActionDate: string | null }>();

    (contactsQuery.data || []).forEach((c: any) => {
      if (!c.funnel_id) return;
      const existing = contactsByFunnel.get(c.funnel_id);
      if (!existing || c.created_at > existing.lastContact) {
        contactsByFunnel.set(c.funnel_id, {
          lastContact: c.created_at,
          hasNextAction: !!c.next_action_date,
          nextActionDate: c.next_action_date,
        });
      }
    });

    return funnelQuery.data.map((item: any) => {
      const contact = contactsByFunnel.get(item.id);
      const daysSinceContact = contact
        ? Math.floor((Date.now() - new Date(contact.lastContact).getTime()) / 86400000)
        : 999;
      const isOverdue = contact?.nextActionDate ? new Date(contact.nextActionDate) < new Date() : false;
      const hasNoFollowUp = !contact?.hasNextAction;

      // Priority score: higher = more urgent
      let priority = 0;
      priority += Math.min(daysSinceContact * 10, 100); // stale = urgent
      if (isOverdue) priority += 50;
      if (hasNoFollowUp) priority += 30;
      priority += (item.value || 0) / 10000; // higher value = more priority
      if (item.probability > 50) priority += 20; // hot leads

      return {
        ...item,
        daysSinceContact,
        isOverdue,
        hasNoFollowUp,
        priority,
        lastContactDate: contact?.lastContact || null,
        nextActionDate: contact?.nextActionDate || null,
      };
    }).sort((a: any, b: any) => b.priority - a.priority);
  }, [funnelQuery.data, contactsQuery.data]);

  return { data: queue, isLoading: funnelQuery.isLoading || contactsQuery.isLoading };
}

// ── Rep Execution Metrics ──
export function useRepExecutionMetrics(dateFrom?: string) {
  return useQuery({
    queryKey: ['rep_execution_metrics', dateFrom],
    queryFn: async () => {
      const from = dateFrom || new Date(new Date().setDate(1)).toISOString().split('T')[0];
      const { data: reps } = await supabase.from('sales_reps').select('id, name, code, monthly_target, total_sales, status').eq('status', 'active');
      const { data: logs } = await supabase.from('sales_contact_logs').select('sales_rep_id, result, created_at, duration_minutes, next_action, response_time_minutes').gte('created_at', from);
      const { data: funnel } = await supabase.from('sales_funnel').select('sales_rep_id, value, stage, status, created_at').gte('created_at', from);

      if (!reps) return [];

      const logsByRep = new Map<string, any[]>();
      (logs || []).forEach((l: any) => {
        if (!l.sales_rep_id) return;
        const arr = logsByRep.get(l.sales_rep_id) || [];
        arr.push(l);
        logsByRep.set(l.sales_rep_id, arr);
      });

      const funnelByRep = new Map<string, any[]>();
      (funnel || []).forEach((f: any) => {
        if (!f.sales_rep_id) return;
        const arr = funnelByRep.get(f.sales_rep_id) || [];
        arr.push(f);
        funnelByRep.set(f.sales_rep_id, arr);
      });

      return reps.map((rep: any) => {
        const repLogs = logsByRep.get(rep.id) || [];
        const repFunnel = funnelByRep.get(rep.id) || [];
        const totalContacts = repLogs.length;
        const proposals = repLogs.filter((l: any) => l.result === 'proposal_sent').length;
        const ordersPlaced = repLogs.filter((l: any) => l.result === 'order_placed').length;
        const noFollowUp = repLogs.filter((l: any) => !l.next_action).length;
        const avgResponseTime = repLogs.length > 0
          ? repLogs.reduce((s: number, l: any) => s + (l.response_time_minutes || 0), 0) / repLogs.length
          : 0;
        const daysInPeriod = Math.max(1, Math.ceil((Date.now() - new Date(from).getTime()) / 86400000));
        const contactsPerDay = totalContacts / daysInPeriod;
        const conversionRate = totalContacts > 0 ? (ordersPlaced / totalContacts) * 100 : 0;
        const pipelineValue = repFunnel.filter((f: any) => f.status === 'active').reduce((s: number, f: any) => s + (f.value || 0), 0);

        return {
          ...rep,
          totalContacts,
          contactsPerDay: Math.round(contactsPerDay * 10) / 10,
          proposals,
          ordersPlaced,
          conversionRate: Math.round(conversionRate * 10) / 10,
          noFollowUp,
          avgResponseTime: Math.round(avgResponseTime),
          pipelineValue,
        };
      }).sort((a: any, b: any) => b.totalContacts - a.totalContacts);
    },
  });
}

// ── Lost Client Recovery ──
export function useLostClients() {
  return useQuery({
    queryKey: ['lost_clients'],
    queryFn: async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, code, segment, total_purchases, avg_ticket, last_purchase_date, sales_rep_id, phone, email, abc_classification')
        .eq('status', 'active')
        .lt('last_purchase_date', ninetyDaysAgo)
        .order('total_purchases', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        daysSinceLastPurchase: c.last_purchase_date
          ? Math.floor((Date.now() - new Date(c.last_purchase_date).getTime()) / 86400000)
          : null,
      }));
    },
  });
}
