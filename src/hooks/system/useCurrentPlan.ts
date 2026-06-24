import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CurrentPlan {
  plan_id: string;
  plan_slug: string;
  plan_name: string;
  max_users: number;
  max_companies: number;
  max_branches: number;
  max_orders_month: number;
  nfe_per_month: number;
  ai_calls_per_month: number;
  storage_mb: number;
  allowed_modules: string[];
  subscription_status: string;
  trial_end: string | null;
}

/**
 * Plano efetivo do usuário logado (via RPC get_current_plan).
 * Cacheado por 10 min para evitar churn.
 */
export function useCurrentPlan() {
  return useQuery({
    queryKey: ['current_plan'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_plan');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as CurrentPlan | null;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Verifica se o plano efetivo libera o módulo informado.
 * Enquanto carrega devolve `undefined` (use para evitar flicker).
 */
export function useHasModule(moduleKey: string): boolean | undefined {
  const { data, isLoading } = useCurrentPlan();
  if (isLoading) return undefined;
  if (!data) return false;
  return data.allowed_modules?.includes(moduleKey) ?? false;
}
