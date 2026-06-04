import { supabase } from '@/integrations/supabase/client';

export const accountingService = {
  async getDashboardData() {
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        lines:journal_entry_lines(*)
      `);
    
    if (error) throw error;

    // Simulate aggregated data for the UI
    const monthlyData = [
      { month: 'Jan', assets: 100000, liabilities: 20000, equity: 80000 },
      { month: 'Fev', assets: 110000, liabilities: 25000, equity: 85000 },
      { month: 'Mar', assets: 125000, liabilities: 30000, equity: 95000 },
    ];

    const trendData = [
      { month: 'Jan', revenue: 15000, expenses: 10000 },
      { month: 'Fev', revenue: 18000, expenses: 12000 },
      { month: 'Mar', revenue: 22000, expenses: 14000 },
    ];

    return {
      entries: entries || [],
      monthlyEquityEvolution: monthlyData,
      revenueExpenseTrend: trendData,
    };
  }
};
