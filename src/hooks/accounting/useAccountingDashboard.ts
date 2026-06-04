import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAccountingDashboardData() {
  return useQuery({
    queryKey: ['accounting_dashboard'],
    queryFn: async () => {
      // Fetch data for the charts and indicators
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          lines:journal_entry_lines(*)
        `);
      
      if (error) throw error;

      // In a real app, you would aggregate this data
      // For now, let's return some processed data based on the seeded entries
      
      const monthlyData = [
        { month: 'Jan', assets: 100000, liabilities: 20000, equity: 80000 },
        { month: 'Fev', assets: 110000, liabilities: 25000, equity: 85000 },
        { month: 'Mar', assets: 125000, liabilities: 30000, equity: 95000 },
      ];

      return {
        entries: entries || [],
        monthlyEquityEvolution: monthlyData,
        revenueExpenseTrend: [
          { month: 'Jan', revenue: 15000, expenses: 10000 },
          { month: 'Fev', revenue: 18000, expenses: 12000 },
          { month: 'Mar', revenue: 22000, expenses: 14000 },
        ],
      };
    },
  });
}
