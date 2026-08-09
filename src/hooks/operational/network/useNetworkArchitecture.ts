import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { networkService } from '@/services/operational/network/networkService';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useNetworkArchitecture = () => {
  const { currentCompany } = useEnterprise();
  
  return useQuery({
    queryKey: ['operational_units', currentCompany?.id],
    queryFn: () => networkService.getOperationalUnits(currentCompany!.id),
    enabled: !!currentCompany?.id
  });
};

export const usePosTerminals = () => {
  const { currentBranch } = useEnterprise();
  return useQuery({
    queryKey: ['pos_terminals', currentBranch?.id],
    queryFn: () => networkService.getPosTerminals(currentBranch!.id),
    enabled: !!currentBranch?.id
  });
};

export const useReplenishmentPolicies = () => {
  const { currentCompany } = useEnterprise();
  return useQuery({
    queryKey: ['replenishment_policies', currentCompany?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('replenishment_policies' as any)
        .select('*, product:products(name, code)')
        .eq('company_id', currentCompany?.id)
        .limit(200);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentCompany?.id
  });
};

export const useTransferOrders = () => {
  const { currentCompany } = useEnterprise();
  return useQuery({
    queryKey: ['transfer_orders', currentCompany?.id],
    queryFn: () => networkService.getTransfers(currentCompany!.id),
    enabled: !!currentCompany?.id
  });
};

export const useSupplyChainStats = () => {
  const { currentCompany } = useEnterprise();
  return useQuery({
    queryKey: ['supply_chain_stats', currentCompany?.id],
    queryFn: async () => {
      const { data: movements } = await supabase
        .from('supply_chain_movements' as any)
        .select('status')
        .eq('company_id', currentCompany?.id)
        .limit(2000);

      const inTransit = movements?.filter((m: any) => m.status === 'in_transit' || m.status === 'shipped').length || 0;
      
      const { count: lowStock } = await supabase
        .from('stock_balances' as any)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', currentCompany?.id)
        .lt('quantity', 10); // Simple threshold for mock

      return {
        inTransit,
        lowStock: lowStock || 0,
        accuracy: 94
      };
    },
    enabled: !!currentCompany?.id
  });
};
