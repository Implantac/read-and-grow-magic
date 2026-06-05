import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventory/inventoryService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function useInventory() {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['inventory_products'],
    queryFn: () => inventoryService.getProducts(),
  });

  const categoriesQuery = useQuery({
    queryKey: ['inventory_categories'],
    queryFn: () => inventoryService.getCategories(),
  });

  const movementsQuery = useQuery({
    queryKey: ['inventory_movements'],
    queryFn: () => inventoryService.getMovements(),
  });

  const createProductMutation = useMutation({
    mutationFn: (product: any) => inventoryService.createProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_products'] });
      toastSuccess('Produto cadastrado com sucesso');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao cadastrar produto');
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => inventoryService.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_products'] });
      toastSuccess('Produto atualizado');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao atualizar produto');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => inventoryService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_products'] });
      toastSuccess('Produto excluído');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao excluir produto');
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
