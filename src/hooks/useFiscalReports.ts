import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FiscalReport } from '@/types/fiscal';

export function useFiscalReports() {
  const [reports, setReports] = useState<FiscalReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('fiscal_reports').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar relatórios fiscais'); setLoading(false); return; }

    const mapped: FiscalReport[] = (data || []).map((row: any) => ({
      id: row.id,
      type: row.type,
      name: row.name,
      period: row.period,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      totalNFe: row.total_nfe,
      totalNFCe: row.total_nfce,
      totalValue: Number(row.total_value),
      totalICMS: Number(row.total_icms),
      totalIPI: Number(row.total_ipi),
      totalPIS: Number(row.total_pis),
      totalCOFINS: Number(row.total_cofins),
      generatedAt: row.generated_at,
      fileUrl: row.file_url,
    }));

    setReports(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { reports, loading, refetch: fetch };
}
