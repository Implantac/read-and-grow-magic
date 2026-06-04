import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlanRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_annual: number;
  trial_days: number;
  max_users: number;
  max_orders_month: number;
  storage_mb: number;
  allowed_modules: string[];
  is_active: boolean;
  sort_order: number;
}

export interface PlanFeatureRow {
  id: string;
  plan_id: string;
  feature_key: string;
  feature_label: string;
  enabled: boolean;
  limit_value: number | null;
}

export interface SubscriptionRow {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  cancelled_at: string | null;
  external_gateway: string | null;
  external_subscription_id: string | null;
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as PlanRow[];
    },
  });
}

export function usePlanFeatures(planId?: string) {
  return useQuery({
    queryKey: ['plan_features', planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_features')
        .select('*')
        .eq('plan_id', planId!);
      if (error) throw error;
      return (data ?? []) as PlanFeatureRow[];
    },
  });
}

export function useSubscription(companyId?: string) {
  return useQuery({
    queryKey: ['subscription', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', companyId!)
        .maybeSingle();
      if (error) throw error;
      return data as SubscriptionRow | null;
    },
  });
}

export function useUsageTracking(companyId?: string, period?: string) {
  return useQuery({
    queryKey: ['usage_tracking', companyId, period],
    enabled: !!companyId,
    queryFn: async () => {
      let query = supabase.from('usage_tracking').select('*').eq('company_id', companyId!);
      if (period) query = query.eq('period', period);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as { id: string; company_id: string; metric: string; current_value: number; limit_value: number | null; period: string }[];
    },
  });
}
