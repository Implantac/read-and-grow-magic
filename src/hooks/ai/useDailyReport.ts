import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export interface DailyReportData {
  report_date: string;
  receivables_due_today: { count: number; total: number; items: any[] };
  receivables_overdue: { count: number; total: number; items: any[] };
  payables_due_today: { count: number; total: number; items: any[] };
  payables_overdue: { count: number; total: number; items: any[] };
  sales_summary: { count: number; total: number; items: any[] };
  cash_flow: { income: number; expense: number; balance: number; entries: any[] };
  generated_at: string;
}

export interface DailyReport {
  id: string;
  report_date: string;
  report_data: DailyReportData;
  generated_at: string;
  generated_by: string;
  created_at: string;
}

export function useDailyReports() {
  return useQuery({
    queryKey: ['daily_executive_reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_executive_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as unknown as DailyReport[];
    },
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('daily-executive-report');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_executive_reports'] });
      toastSuccess('Relatório gerado', 'O relatório executivo diário foi gerado com sucesso.');
    },
    onError: (err: any) => {
      toastError('Erro ao gerar relatório: ' + err.message);
    },
  });
}
