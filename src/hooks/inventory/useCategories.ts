import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/shared/useSupabaseQuery';
import { toastSuccess, handleMutationError } from '@/lib/toastHelpers';

export interface DbCategory {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  active: boolean;
  color: string | null;
  icon: string | null;
  created_at?: string;
  updated_at?: string;
  products_count?: number;
}

const FALLBACK_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

export function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return FALLBACK_COLORS[Math.abs(h) % FALLBACK_COLORS.length];
}

async function fetchCategoriesWithCount(): Promise<DbCategory[]> {
  const { data: cats, error } = await supabase
    .from('categories')
    .select('id,name,description,parent_id,active,color,icon,created_at,updated_at')
    .order('name');
  if (error) throw error;
  const { data: prods } = await supabase.from('products').select('category_id');
  const counts = new Map<string, number>();
  (prods || []).forEach((p: { category_id: string | null }) => {
    if (!p.category_id) return;
    counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1);
  });
  return (cats || []).map((c) => ({ ...(c as DbCategory), products_count: counts.get(c.id) || 0 }));
}

/** React Query hook usado na página de gestão de categorias. */
export function useCategories() {
  return useSupabaseQuery(['categories'], fetchCategoriesWithCount);
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useSupabaseMutation(
    async (payload: Partial<DbCategory> & { name: string }) => {
      const { data, error } = await supabase.from('categories').insert(payload as never).select().single();
      if (error) throw error;
      return data;
    },
    { onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toastSuccess('Categoria criada'); }, onError: handleMutationError },
  );
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useSupabaseMutation(
    async ({ id, ...rest }: Partial<DbCategory> & { id: string }) => {
      const { data, error } = await supabase.from('categories').update(rest as never).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    { onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toastSuccess('Categoria atualizada'); }, onError: handleMutationError },
  );
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useSupabaseMutation(
    async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    { onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toastSuccess('Categoria excluída'); }, onError: handleMutationError },
  );
}

/** Lightweight hook para o PDV — só categorias ativas, sem contagem. */
export function useActiveCategories() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('id,name,description,parent_id,active,color,icon')
      .eq('active', true)
      .order('name');
    setCategories((data as DbCategory[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  return { categories, loading, refetch: fetchAll };
}
