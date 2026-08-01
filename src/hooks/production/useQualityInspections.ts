import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface QualityInspection {
  id: string;
  production_order_id: string;
  step_id: string | null;
  inspector: string;
  inspection_date: string;
  approved_quantity: number;
  rejected_quantity: number;
  defect_reason: string | null;
  defect_category: string | null;
  severity: string;
  corrective_action: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  order_number?: string;
  step_name?: string;
}

/** tabela quality_inspections ainda não presente nos tipos gerados */
type LooseQuery = {
  select: (columns: string) => LooseQuery;
  order: (column: string, opts: { ascending: boolean }) => Promise<{ data: unknown; error: unknown }>;
  insert: (values: unknown) => Promise<{ error: unknown }>;
};

const looseTable = (table: string): LooseQuery =>
  (supabase as unknown as { from: (t: string) => LooseQuery }).from(table);

type InspectionRow = QualityInspection & {
  production_orders?: { order_number?: string } | null;
  production_steps?: { name?: string } | null;
};

export function useQualityInspections() {
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await looseTable('quality_inspections')
      .select('*, production_orders(order_number), production_steps(name)')
      .order('inspection_date', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar inspeções'); }
    else {
      setInspections(((data as InspectionRow[] | null) || []).map((d) => ({
        ...d,
        order_number: d.production_orders?.order_number,
        step_name: d.production_steps?.name,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (inspection: Partial<QualityInspection>) => {
    const { error } = await looseTable('quality_inspections').insert(inspection);
    if (error) { toast.error('Erro ao registrar inspeção'); return false; }
    toast.success('Inspeção registrada');
    await fetch();
    return true;
  };

  return { inspections, loading, refetch: fetch, create };
}
