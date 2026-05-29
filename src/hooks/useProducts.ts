import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mutationErrorHandler, toastSuccess } from '@/lib/toastHelpers';

export interface DbProduct {
  id: string;
  code: string;
  barcode: string | null;
  name: string;
  description: string | null;
  type: string;
  category_id: string | null;
  subcategory: string | null;
  unit: string;
  weight: number | null;
  width: number | null;
  height: number | null;
  depth: number | null;
  cost_price: number;
  sale_price: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  lead_time_days: number;
  supplier: string | null;
  location: string | null;
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  // joined
  category_name?: string;
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]).map((p) => ({
        ...p,
        category_name: p.categories?.name || '',
      })) as DbProduct[];
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (product: Omit<DbProduct, 'id' | 'created_at' | 'updated_at' | 'category_name'>) => {
      const { data, error } = await supabase.from('products').insert(product).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toastSuccess('Produto criado com sucesso!');
    },
    onError: mutationErrorHandler('Erro ao criar produto'),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, category_name, ...product }: Partial<DbProduct> & { id: string; category_name?: string }) => {
      const { data, error } = await supabase.from('products').update({ ...product, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toastSuccess('Produto atualizado com sucesso!');
    },
    onError: mutationErrorHandler('Erro ao atualizar produto'),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toastSuccess('Produto excluído com sucesso!');
    },
    onError: mutationErrorHandler('Erro ao excluir produto'),
  });
}
