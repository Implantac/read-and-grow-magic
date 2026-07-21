import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductionSector {
  id: string;
  code: string;
  name: string;
  responsible: string | null;
  sector_type: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProductionSectors() {
  const [sectors, setSectors] = useState<ProductionSector[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from('production_sectors').select('*').order('code');
    if (error) { console.error(error); toast.error('Erro ao carregar setores'); }
    else setSectors(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (item: Partial<ProductionSector>) => {
    const { error } = await (supabase as any).from('production_sectors').insert(item);
    if (error) { toast.error('Erro ao criar setor'); return false; }
    toast.success('Setor cadastrado');
    await fetch();
    return true;
  };

  const update = async (id: string, updates: Partial<ProductionSector>) => {
    const { error } = await (supabase as any).from('production_sectors').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar setor'); return false; }
    toast.success('Setor atualizado');
    await fetch();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await (supabase as any).from('production_sectors').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir setor'); return; }
    toast.success('Setor excluído');
    await fetch();
  };

  const activeSectors = sectors.filter(s => s.is_active);

  return { sectors, activeSectors, loading, refetch: fetch, create, update, remove };
}
