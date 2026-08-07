import { useQuery } from "@tanstack/react-query";
import { storeService } from "@/services/operational/store/storeService";
import { useEnterprise } from "@/core/auth/EnterpriseContext";

export function useStoreCentral() {
  const { currentBranch } = useEnterprise();
  const activeBranchId = currentBranch?.id;

  const kpisQuery = useQuery({
    queryKey: ['store-kpis', activeBranchId],
    queryFn: () => storeService.getStoreKPIs(activeBranchId!),
    enabled: !!activeBranchId,
  });

  const alertsQuery = useQuery({
    queryKey: ['store-alerts', activeBranchId],
    queryFn: () => storeService.getOperationalAlerts(activeBranchId!),
    enabled: !!activeBranchId,
  });

  const healthQuery = useQuery({
    queryKey: ['store-health', activeBranchId],
    queryFn: () => storeService.getStoreHealth(activeBranchId!),
    enabled: !!activeBranchId,
  });

  const reliabilityQuery = useQuery({
    queryKey: ['store-reliability', activeBranchId],
    queryFn: () => storeService.getStockReliability(activeBranchId!),
    enabled: !!activeBranchId,
  });

  return {
    kpis: kpisQuery.data,
    alerts: alertsQuery.data,
    health: healthQuery.data,
    reliability: reliabilityQuery.data,
    isLoading: kpisQuery.isLoading || alertsQuery.isLoading || healthQuery.isLoading || reliabilityQuery.isLoading,
    isError: kpisQuery.isError || alertsQuery.isError || healthQuery.isError || reliabilityQuery.isError,
    refetch: () => {
      kpisQuery.refetch();
      alertsQuery.refetch();
      healthQuery.refetch();
      reliabilityQuery.refetch();
    }
  };
}
