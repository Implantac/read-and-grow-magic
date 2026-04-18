import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialInsight {
  type: 'alert' | 'recommendation' | 'opportunity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric?: string;
  value?: number;
}

export interface FinancialInsightsResponse {
  score: number;
  scoreGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  metrics: {
    currentBalance: number;
    inflow30d: number;
    outflow30d: number;
    netCashFlow30d: number;
    overdueReceivable: number;
    overduePayable: number;
    projectedBalance30d: number;
    projectedBalance60d: number;
    projectedBalance90d: number;
    expenseGrowth: number;
  };
  insights: FinancialInsight[];
  computedAt: string;
}

export function useFinancialInsights() {
  return useQuery({
    queryKey: ['financial_insights'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('financial-insights');
      if (error) throw error;
      return data as FinancialInsightsResponse;
    },
    staleTime: 2 * 60 * 1000,
  });
}
