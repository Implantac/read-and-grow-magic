import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionService } from '@/services/production/productionService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function useProduction() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['production_orders'],
    queryFn: () => productionService.getProductionOrders(),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => productionService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production_orders'] });
      toastSuccess('Status da ordem de produção atualizado');
    },
    onError: (error: any) => {
      console.error('Error updating production order:', error);
      toastError('Erro ao atualizar ordem de produção');
    }
  });

  const resourcesQuery = useQuery({
    queryKey: ['production_resources'],
    queryFn: () => productionService.getResources(),
  });

  const qualityQuery = useQuery({
    queryKey: ['quality_inspections'],
    queryFn: () => productionService.getQualityInspections(),
  });

  return {
    orders: ordersQuery.data || [],
    ordersLoading: ordersQuery.isLoading,
    updateOrderStatus: updateOrderStatusMutation.mutate,
    resources: resourcesQuery.data || [],
    resourcesLoading: resourcesQuery.isLoading,
    qualityInspections: qualityQuery.data || [],
    qualityLoading: qualityQuery.isLoading,
  };
}
