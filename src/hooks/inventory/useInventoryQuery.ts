import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService, type ProductWithCategory } from '@/services/inventory/inventoryService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { errorMessage } from '@/lib/errors';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export function useInventory() {
  const queryClient = useQueryClient();

  const productsQuery = useQuery<ProductWithCategory[]>({
    queryKey: ['inventory_products'],
    queryFn: () => inventoryService.getProducts(),
  });

  const categoriesQuery = useQuery<Tables<'categories'>[]>({
    queryKey: ['inventory_categories'],
    queryFn: () => inventoryService.getCategories(),
  });

  const movementsQuery = useQuery<Tables<'stock_movements'>[]>({
    queryKey: ['inventory_movements'],
    queryFn: () => inventoryService.getMovements(),
  });

  const createProductMutation = useMutation({
    mutationFn: (product: TablesInsert<'products'>) => inventoryService.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_products'] });
      toastSuccess('Produto cadastrado com sucesso');
    },
    onError: (error: unknown) => {
      toastError(errorMessage(error, 'Erro ao cadastrar produto'));
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<'products'> }) =>
      inventoryService.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_products'] });
      toastSuccess('Produto atualizado');
    },
    onError: (error: unknown) => {
      toastError(errorMessage(error, 'Erro ao atualizar produto'));
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_products'] });
      toastSuccess('Produto excluído');
    },
    onError: (error: unknown) => {
      toastError(errorMessage(error, 'Erro ao excluir produto'));
    }
  });

  return {
    products: productsQuery.data || [],
    productsLoading: productsQuery.isLoading,
    categories: categoriesQuery.data || [],
    categoriesLoading: categoriesQuery.isLoading,
    movements: movementsQuery.data || [],
    movementsLoading: movementsQuery.isLoading,
    
    // Mutations
    createProduct: createProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    deleteProduct: deleteProductMutation.mutateAsync,
  };
}
