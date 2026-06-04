import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionLine {
  id: string;
  code: string;
  name: string;
  sector_id: string | null;
  capacity_per_hour: number;
  shift: string;
  responsible: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined
  sector_name?: string;
}

export function useProductionLines() {
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('production_lines')
      .select('*, production_sectors(name)')
      .order('code');
    if (error) { console.error(error); toast.error('Erro ao carregar linhas'); }
    else setLines((data || []).map((d: any) => ({ ...d, sector_name: d.production_sectors?.name })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (item: Partial<ProductionLine>) => {
    const { error } = await (supabase as any).from('production_lines').insert(item);
    if (error) { toast.error('Erro ao criar linha'); return false; }
    toast.success('Linha cadastrada');
    await fetch();
    return true;
  };

  const update = async (id: string, updates: Partial<ProductionLine>) => {
    const { error } = await (supabase as any).from('production_lines').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar linha'); return false; }
    toast.success('Linha atualizada');
    await fetch();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from('production_lines').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir linha'); return; }
    toast.success('Linha excluída');
    await fetch();
  };

  return { lines, loading, refetch: fetch, create, update, remove };
}
