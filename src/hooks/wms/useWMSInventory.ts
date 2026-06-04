import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/services/wms/inventoryService';

export function useWMSInventory() {
  const itemsQuery = useQuery({
    queryKey: ['wms_inventory_items'],
    queryFn: () => inventoryService.getInventoryItems(),
  });

  const countsQuery = useQuery({
    queryKey: ['wms_inventory_counts'],
    queryFn: () => inventoryService.getInventoryCounts(),
  });

  return {
    items: itemsQuery.data || [],
    counts: countsQuery.data || [],
    loading: itemsQuery.isLoading || countsQuery.isLoading,
    refetch: () => {
      itemsQuery.refetch();
      countsQuery.refetch();
    },
    error: itemsQuery.error || countsQuery.error,
  };
}
