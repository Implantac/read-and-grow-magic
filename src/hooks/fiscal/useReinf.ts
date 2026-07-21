import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ReinfPeriod = {
  id: string;
  company_id: string;
  competencia: string;
  status: 'aberto' | 'fechado' | 'reaberto';
  closed_at: string | null;
  totals: Record<string, number> | null;
};

export type ReinfEvent = {
  id: string;
  period_id: string;
  event_type: 'R-2010' | 'R-2020' | 'R-4020' | 'R-2099' | 'R-4099';
  status: string;
  cnpj_prestador: string | null;
  cnpj_beneficiario: string | null;
  nota_fiscal: string | null;
  data_emissao: string | null;
  vr_bruto: number;
  vr_ret_inss: number | null;
  vr_ret_ir: number | null;
  vr_ret_csll: number | null;
  vr_ret_pis: number | null;
  vr_ret_cofins: number | null;
  cod_serv: string | null;
  cod_receita: string | null;
};

function firstDayOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function useReinf() {
  const [competencia, setCompetencia] = useState<string>(firstDayOfMonth());
  const [periods, setPeriods] = useState<ReinfPeriod[]>([]);
  const [events, setEvents] = useState<ReinfEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: p } = await supabase
        .from('reinf_periods')
        .select('*')
        .order('competencia', { ascending: false });
      setPeriods((p as ReinfPeriod[]) || []);
      const period = (p as ReinfPeriod[] | null)?.find((x) => x.competencia === competencia);
      if (period) {
        const { data: e } = await supabase
          .from('reinf_events')
          .select('*')
          .eq('period_id', period.id)
          .order('event_type');
        setEvents((e as ReinfEvent[]) || []);
      } else {
        setEvents([]);
      }
    } finally {
      setLoading(false);
    }
  }, [competencia]);

  useEffect(() => {
    load();
  }, [load]);

  const call = async (fn: 'reinf_open_period' | 'reinf_generate_r2010' | 'reinf_generate_r2020' | 'reinf_generate_r4020' | 'reinf_close_period', label: string) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc(fn as any, { p_competencia: competencia });
      if (error) throw error;
      toast.success(`${label} concluído`, { description: typeof data === 'number' ? `${data} evento(s)` : undefined });
      await load();
    } catch (err: any) {
      toast.error(`Falha em ${label}`, { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const reopen = async (periodId: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc('reinf_reopen_period', { p_period_id: periodId });
      if (error) throw error;
      toast.success('Competência reaberta');
      await load();
    } catch (err: any) {
      toast.error('Falha ao reabrir', { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  const currentPeriod = periods.find((p) => p.competencia === competencia) || null;

  return {
    competencia, setCompetencia,
    periods, events, currentPeriod,
    loading, busy,
    openPeriod: () => call('reinf_open_period', 'Abertura'),
    generateR2010: () => call('reinf_generate_r2010', 'Geração R-2010'),
    generateR2020: () => call('reinf_generate_r2020', 'Geração R-2020'),
    generateR4020: () => call('reinf_generate_r4020', 'Geração R-4020'),
    closePeriod: () => call('reinf_close_period', 'Fechamento'),
    reopen,
    reload: load,
  };
}
