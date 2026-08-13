import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { networkService } from '@/services/operational/network/networkService';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useNetworkArchitecture = () => {
  const { currentCompany } = useEnterprise();
  const companyId = currentCompany?.id;
  
  return useQuery({
    queryKey: ['operational_units', companyId],
    queryFn: () => networkService.getOperationalUnits(companyId!),
    enabled: !!companyId
  });
};

export const usePosTerminals = () => {
  const { currentBranch } = useEnterprise();
  const branchId = currentBranch?.id;
  
  return useQuery({
    queryKey: ['pos_terminals', branchId],
    queryFn: () => networkService.getPosTerminals(branchId!),
    enabled: !!branchId
  });
};

export const useReplenishmentPolicies = () => {
  const { currentCompany } = useEnterprise();
  const companyId = currentCompany?.id;
  
  return useQuery({
    queryKey: ['replenishment_policies', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('replenishment_policies')
        .select('*, product:products(name, code)')
        .eq('company_id', companyId)
        .limit(200);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId
  });
};

export const useTransferOrders = () => {
  const { currentCompany } = useEnterprise();
  const companyId = currentCompany?.id;
  
  return useQuery({
    queryKey: ['transfer_orders', companyId],
    queryFn: () => networkService.getTransfers(companyId!),
    enabled: !!companyId
  });
};

export const useSupplyChainStats = () => {
  const { currentCompany } = useEnterprise();
  const companyId = currentCompany?.id;
  
  return useQuery({
    queryKey: ['supply_chain_stats', companyId],
    queryFn: async () => {
      const { data: movements } = await supabase
        .from('supply_chain_movements')
        .select('status')
        .eq('company_id', companyId)
        .limit(2000);

      const inTransit = movements?.filter((m: any) => m.status === 'in_transit' || m.status === 'shipped').length || 0;
      
      const { count: lowStock } = await supabase
        .from('stock_balances')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .lt('quantity', 10); // Simple threshold for mock

      return {
        inTransit,
        lowStock: lowStock || 0,
        accuracy: 94
      };
    },
    enabled: !!companyId
  });
};
