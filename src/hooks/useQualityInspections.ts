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
  // joined
  order_number?: string;
  step_name?: string;
}

export function useQualityInspections() {
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quality_inspections')
      .select('*, production_orders(order_number), production_steps(name)')
      .order('inspection_date', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar inspeções'); }
    else {
      setInspections((data || []).map((d: any) => ({
        ...d,
        order_number: d.production_orders?.order_number,
        step_name: d.production_steps?.name,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (inspection: Partial<QualityInspection>) => {
    const { error } = await supabase.from('quality_inspections').insert(inspection as any);
    if (error) { toast.error('Erro ao registrar inspeção'); return false; }
    toast.success('Inspeção registrada');
    await fetch();
    return true;
  };

  return { inspections, loading, refetch: fetch, create };
}
