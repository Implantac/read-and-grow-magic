import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SpedFile {
  id: string;
  type: 'sped_fiscal' | 'sped_contribuicoes';
  period: string;
  startDate: string;
  endDate: string;
  content: string;
  totalRecords: number;
  totalValue: number;
  generatedAt: string;
}

export function useSpedFiles() {
  const [files, setFiles] = useState<SpedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sped_files' as any)
      .select('id,type,period,start_date,end_date,total_records,total_value,generated_at')
      .order('generated_at', { ascending: false });
    if (error) { toast.error('Erro ao carregar arquivos SPED'); setLoading(false); return; }
    setFiles((data || []).map((r: any) => ({
      id: r.id,
      type: r.type,
      period: r.period,
      startDate: r.start_date,
      endDate: r.end_date,
      content: '',
      totalRecords: r.total_records,
      totalValue: Number(r.total_value),
      generatedAt: r.generated_at,
    })));
    setLoading(false);
  }, []);

  const generate = useCallback(async (type: 'sped_fiscal' | 'sped_contribuicoes', startDate: string, endDate: string) => {
    if (generating) return false;
    setGenerating(true);
    try {
      const fnName = type === 'sped_fiscal' ? 'generate_sped_fiscal' : 'generate_sped_contribuicoes';
      const { data, error } = await supabase.rpc(fnName as any, { p_start: startDate, p_end: endDate });
      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;
      if (!row || !row.content) throw new Error('Sem retorno de conteúdo do servidor');

      const period = startDate.slice(0, 7);
      const { error: insErr } = await supabase.from('sped_files' as any).insert({
        type,
        period,
        start_date: startDate,
        end_date: endDate,
        content: row.content,
        total_records: row.total_records || 0,
        total_value: row.total_value || 0,
      });
      if (insErr) throw insErr;

      toast.success(`${type === 'sped_fiscal' ? 'SPED Fiscal' : 'SPED Contribuições'} gerado com sucesso`);
      await fetchFiles();
      return true;
    } catch (e: any) {
      console.error('SPED Generation error:', e);
      toast.error('Erro ao gerar SPED: ' + (e.message || 'Erro desconhecido'));
      return false;
    } finally {
      setGenerating(false);
    }
  }, [fetchFiles, generating]);

  const download = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('sped_files' as any)
      .select('content,type,period')
      .eq('id', id)
      .single();
    if (error || !data) { toast.error('Erro ao baixar arquivo'); return; }
    const row: any = data;
    const blob = new Blob([row.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${row.type}_${row.period}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('sped_files' as any).delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Arquivo excluído');
    await fetchFiles();
  }, [fetchFiles]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  return { files, loading, generating, generate, download, remove, refetch: fetchFiles };
}
