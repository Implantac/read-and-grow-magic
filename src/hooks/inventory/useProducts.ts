import { useQueryClient } from '@tanstack/react-query';
import { productsService } from '@/services/inventory/productsService';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/shared/useSupabaseQuery';
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
  category_name?: string;
}

export function useProducts() {
  return useSupabaseQuery(['products'], () => productsService.getAll());
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    (product: Omit<DbProduct, 'id' | 'created_at' | 'updated_at' | 'category_name'>) => 
      productsService.create(product),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toastSuccess('Produto criado com sucesso!');
      },
      onError: mutationErrorHandler('Erro ao criar produto'),
    }
  );
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    ({ id, category_name, ...product }: Partial<DbProduct> & { id: string; category_name?: string }) => 
      productsService.update(id, product),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toastSuccess('Produto atualizado com sucesso!');
      },
      onError: mutationErrorHandler('Erro ao atualizar produto'),
    }
  );
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useSupabaseMutation(
    (id: string) => productsService.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
        toastSuccess('Produto excluído com sucesso!');
      },
      onError: mutationErrorHandler('Erro ao excluir produto'),
    }
  );
}
