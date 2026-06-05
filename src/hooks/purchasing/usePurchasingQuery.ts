import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasingService } from '@/services/purchasing/purchasingService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function usePurchasing() {
  const queryClient = useQueryClient();

  const suppliersQuery = useQuery({
    queryKey: ['purchasing_suppliers'],
    queryFn: () => purchasingService.getSuppliers(),
  });

  const ordersQuery = useQuery({
    queryKey: ['purchasing_orders'],
    queryFn: () => purchasingService.getPurchaseOrders(),
  });

  const quotationsQuery = useQuery({
    queryKey: ['purchasing_quotations'],
    queryFn: () => purchasingService.getQuotations(),
  });

  const createSupplierMutation = useMutation({
    mutationFn: (supplier: any) => purchasingService.createSupplier(supplier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchasing_suppliers'] });
      toastSuccess('Fornecedor cadastrado com sucesso');
    }
  });

  return {
    suppliers: suppliersQuery.data || [],
    suppliersLoading: suppliersQuery.isLoading,
    orders: ordersQuery.data || [],
    ordersLoading: ordersQuery.isLoading,
    quotations: quotationsQuery.data || [],
    quotationsLoading: quotationsQuery.isLoading,
    
    createSupplier: createSupplierMutation.mutateAsync,
  };
}
