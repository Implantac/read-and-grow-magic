import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('suppliers').select('*').order('name');
    if (error) { console.error(error); toast.error('Erro ao carregar fornecedores'); }
    else setSuppliers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (supplier: any) => {
    const { error } = await supabase.from('suppliers').insert(supplier);
    if (error) { toast.error('Erro ao criar fornecedor'); return; }
    toast.success('Fornecedor criado');
    await fetch();
  };

  const update = async (id: string, updates: any) => {
    const { error } = await supabase.from('suppliers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar fornecedor'); return; }
    toast.success('Fornecedor atualizado');
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir fornecedor'); return; }
    toast.success('Fornecedor excluído');
    await fetch();
  };

  return { suppliers, loading, refetch: fetch, create, update, remove };
}
