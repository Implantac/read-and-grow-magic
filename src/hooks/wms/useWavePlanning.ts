import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WavePlanOrder {
  id: string;
  order_number: string;
  priority: string;
  items: number;
  operator: number;
}
export interface WavePlanGroup {
  orders: WavePlanOrder[];
}
export interface WavePlanResult {
  company_id: string;
  orders_total: number;
  waves_planned: number;
  operators: number;
  committed: boolean;
  waves: WavePlanGroup[];
}

export interface WavePlanInput {
  cutoff?: string | null;
  carrier?: string | null;
  zone?: string | null;
  minPriority?: string | null;
  maxOrdersPerWave?: number;
  operators?: number;
  commit?: boolean;
}

export function useWavePlanning() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WavePlanResult | null>(null);

  const plan = async (input: WavePlanInput) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('wms_wave_plan_v2', {
        _cutoff: input.cutoff ?? null,
        _carrier: input.carrier ?? null,
        _zone: input.zone ?? null,
        _min_priority: input.minPriority ?? null,
        _max_orders_per_wave: input.maxOrdersPerWave ?? 20,
        _operators: input.operators ?? 1,
        _commit: input.commit ?? false,
      });
      if (error) throw error;
      const res = data as unknown as WavePlanResult;
      setResult(res);
      if (input.commit) {
        toast.success(`${res.waves_planned} ondas criadas com ${res.orders_total} pedidos`);
      }
      return res;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao planejar ondas';
      toast.error(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { plan, loading, result };
}
