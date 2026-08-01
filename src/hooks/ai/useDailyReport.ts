import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { errorMessage } from '@/lib/errors';

export interface DailyReportTitle {
  id: string;
  description: string | null;
  client_name?: string | null;
  supplier?: string | null;
  due_date?: string | null;
  amount: number;
}

export interface DailyReportSale {
  id: string;
  number: string | null;
  client_name: string | null;
  status: string | null;
  total: number;
}

export interface DailyReportCashEntry {
  id: string;
  description: string | null;
  type: string | null;
  amount: number;
  date?: string | null;
}

export interface DailyReportData {
  report_date: string;
  receivables_due_today: { count: number; total: number; items: DailyReportTitle[] };
  receivables_overdue: { count: number; total: number; items: DailyReportTitle[] };
  payables_due_today: { count: number; total: number; items: DailyReportTitle[] };
  payables_overdue: { count: number; total: number; items: DailyReportTitle[] };
  sales_summary: { count: number; total: number; items: DailyReportSale[] };
  cash_flow: { income: number; expense: number; balance: number; entries: DailyReportCashEntry[] };
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
    onError: (err: unknown) => {
      toastError('Erro ao gerar relatório: ' + errorMessage(err));
    },
  });
}
