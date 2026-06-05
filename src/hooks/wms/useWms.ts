import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wmsService } from '@/services/wms/wmsService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function useWms() {
  const queryClient = useQueryClient();

  const stockBalancesQuery = useQuery({
    queryKey: ['stock_balances'],
    queryFn: () => wmsService.getStockBalances(),
  });

  const movementsQuery = useQuery({
    queryKey: ['stock_movements'],
    queryFn: () => wmsService.getMovements(),
  });

  const storageLocationsQuery = useQuery({
    queryKey: ['storage_locations'],
    queryFn: () => wmsService.getStorageLocations(),
  });

  return {
    stockBalances: stockBalancesQuery.data || [],
    stockLoading: stockBalancesQuery.isLoading,
    movements: movementsQuery.data || [],
    movementsLoading: movementsQuery.isLoading,
    storageLocations: storageLocationsQuery.data || [],
    storageLoading: storageLocationsQuery.isLoading,
  };
}
