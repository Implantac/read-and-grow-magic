import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FiscalReport } from '@/types/fiscal';

export function useFiscalReports() {
  const [reports, setReports] = useState<FiscalReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
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

  const create = useCallback(async (reportData: {
    type: string;
    name: string;
    period: string;
    startDate: string;
    endDate: string;
  }) => {
    // Aggregate NF-e data for the period
    const { data: nfeData } = await supabase.from('nfe').select('*')
      .gte('issue_date', reportData.startDate)
      .lte('issue_date', reportData.endDate)
      .eq('status', 'authorized');

    const { data: nfceData } = await supabase.from('nfce').select('*')
      .gte('issue_date', reportData.startDate)
      .lte('issue_date', reportData.endDate)
      .eq('status', 'authorized');

    const nfes = nfeData || [];
    const nfces = nfceData || [];

    const totalICMS = nfes.reduce((s: number, n: any) => s + Number(n.icms), 0);
    const totalIPI = nfes.reduce((s: number, n: any) => s + Number(n.ipi), 0);
    const totalPIS = nfes.reduce((s: number, n: any) => s + Number(n.pis), 0);
    const totalCOFINS = nfes.reduce((s: number, n: any) => s + Number(n.cofins), 0);
    const totalValue = nfes.reduce((s: number, n: any) => s + Number(n.total), 0) + nfces.reduce((s: number, n: any) => s + Number(n.total), 0);

    const { error } = await supabase.from('fiscal_reports').insert({
      type: reportData.type,
      name: reportData.name,
      period: reportData.period,
      start_date: reportData.startDate,
      end_date: reportData.endDate,
      total_nfe: nfes.length,
      total_nfce: nfces.length,
      total_value: totalValue,
      total_icms: totalICMS,
      total_ipi: totalIPI,
      total_pis: totalPIS,
      total_cofins: totalCOFINS,
      status: 'pending',
    });

    if (error) { toast.error('Erro ao criar relatório'); return false; }
    toast.success('Relatório criado com sucesso');
    await fetchReports();
    return true;
  }, [fetchReports]);

  const generate = useCallback(async (id: string) => {
    const { error } = await supabase.from('fiscal_reports').update({
      status: 'generated',
      generated_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) { toast.error('Erro ao gerar relatório'); return false; }
    toast.success('Relatório gerado com sucesso!');
    await fetchReports();
    return true;
  }, [fetchReports]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return { reports, loading, refetch: fetchReports, create, generate };
}
