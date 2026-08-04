import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [realtimeStatus, setRealtimeStatus] = useState<'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED' | 'SUBSCRIBING'>('SUBSCRIBING');

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    let timeoutId: NodeJS.Timeout;

    const setupChannel = () => {
      const channel = supabase
        .channel('plan-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions'
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['current_plan'] });
          }
        )
        .subscribe((status) => {
          setRealtimeStatus(status as any);
          if (status === 'SUBSCRIBED') {
            retryCount = 0;
          }
          
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`Erro Realtime (status: ${status}). Tentativa ${retryCount + 1} de ${maxRetries}`);
            
            if (retryCount < maxRetries) {
              const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
              retryCount++;
              
              timeoutId = setTimeout(() => {
                supabase.removeChannel(channel);
                setupChannel();
              }, backoffDelay);
            } else {
              toast({
                variant: "destructive",
                title: "Conexão Instável",
                description: "Não foi possível restabelecer a conexão em tempo real. O sistema usará dados em cache.",
              });
            }
          }
        });

      return channel;
    };

    const channel = setupChannel();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  const query = useQuery({
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

  return {
    ...query,
    realtimeStatus
  };
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
