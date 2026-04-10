import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const STAGE_WEIGHTS: Record<string, number> = {
  lead: 0.10,
  opportunity: 0.30,
  proposal: 0.50,
  negotiation: 0.70,
  waiting_client: 0.85,
  approved: 1.0,
};

export function useSalesForecasts(period?: string) {
  return useQuery({
    queryKey: ['sales-forecasts', period],
    queryFn: async () => {
      let query = supabase.from('sales_forecasts').select('*').order('snapshot_date', { ascending: false });
      if (period) query = query.eq('period', period);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useForecastCalculation(period: string) {
  return useQuery({
    queryKey: ['forecast-calculation', period],
    queryFn: async () => {
      // Get pipeline data from sales_funnel
      const { data: pipeline } = await supabase
        .from('sales_funnel')
        .select('*')
        .in('status', ['active', 'open'])
        .not('value', 'is', null);

      // Get confirmed orders for the period
      const startOfMonth = `${period}-01`;
      const { data: orders } = await supabase
        .from('orders')
        .select('total, status, sales_rep_name, sales_rep_id')
        .gte('date', startOfMonth)
        .in('status', ['confirmed', 'approved', 'invoiced', 'delivered']);

      const confirmedValue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      let weightedPipeline = 0;
      let totalPipeline = 0;
      pipeline?.forEach((item) => {
        const val = item.value || 0;
        totalPipeline += val;
        const weight = STAGE_WEIGHTS[item.stage] || 0.3;
        weightedPipeline += val * weight;
      });

      const optimistic = confirmedValue + totalPipeline;
      const realistic = confirmedValue + weightedPipeline;
      const conservative = confirmedValue + weightedPipeline * 0.7;

      // By sales rep
      const byRep: Record<string, { confirmed: number; weighted: number; name: string }> = {};
      orders?.forEach((o) => {
        if (!o.sales_rep_id) return;
        if (!byRep[o.sales_rep_id]) byRep[o.sales_rep_id] = { confirmed: 0, weighted: 0, name: o.sales_rep_name || '' };
        byRep[o.sales_rep_id].confirmed += o.total || 0;
      });
      pipeline?.forEach((p) => {
        if (!p.sales_rep_id) return;
        const key = p.sales_rep_id;
        if (!byRep[key]) byRep[key] = { confirmed: 0, weighted: 0, name: '' };
        byRep[key].weighted += (p.value || 0) * (STAGE_WEIGHTS[p.stage] || 0.3);
      });

      return {
        confirmedValue,
        totalPipeline,
        weightedPipeline,
        optimistic,
        realistic,
        conservative,
        byRep: Object.entries(byRep).map(([id, v]) => ({ id, ...v, total: v.confirmed + v.weighted })),
        pipelineByStage: Object.entries(
          (pipeline || []).reduce((acc, p) => {
            acc[p.stage] = (acc[p.stage] || 0) + (p.value || 0);
            return acc;
          }, {} as Record<string, number>)
        ).map(([stage, value]) => ({ stage, value, weight: STAGE_WEIGHTS[stage] || 0.3 })),
      };
    },
  });
}

export function useForecastMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveForecast = useMutation({
    mutationFn: async (forecast: any) => {
      const { data, error } = await supabase.from('sales_forecasts').insert(forecast).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-forecasts'] });
      toast({ title: 'Forecast salvo' });
    },
  });

  return { saveForecast };
}
