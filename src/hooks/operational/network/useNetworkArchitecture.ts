import { useState, useEffect } from 'react';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { networkService, type OperationalUnit } from '@/services/operational/network/networkService';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

export const useNetworkArchitecture = () => {
  const { currentCompany } = useEnterprise();
  const [units, setUnits] = useState<OperationalUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentCompany?.id) {
      loadUnits();
    }
  }, [currentCompany?.id]);

  const loadUnits = async () => {
    try {
      setIsLoading(true);
      const data = await networkService.getOperationalUnits(currentCompany!.id);
      setUnits(data);
    } catch (error) {
      console.error('Error loading units:', error);
      toast.error('Erro ao carregar rede operacional');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    units,
    isLoading,
    refresh: loadUnits
  };
};

export const usePosTerminals = () => {
  const { currentCompany } = useEnterprise();
  return useQuery({
    queryKey: ['pos_terminals', currentCompany?.id],
    queryFn: async () => {
      // Mock for now, will connect to DB soon
      return [
        { id: '1', name: 'PDV 01', code: 'PDV-001', status: 'active' },
        { id: '2', name: 'PDV 02', code: 'PDV-002', status: 'active' },
      ];
    },
    enabled: !!currentCompany?.id
  });
};

export const useReplenishmentPolicies = () => {
  const { currentCompany } = useEnterprise();
  return useQuery({
    queryKey: ['replenishment_policies', currentCompany?.id],
    queryFn: async () => {
      // Mock for now
      return [];
    },
    enabled: !!currentCompany?.id
  });
};

export const useTransferOrders = () => {
  const { currentCompany } = useEnterprise();
  return useQuery({
    queryKey: ['transfer_orders', currentCompany?.id],
    queryFn: async () => {
      // Mock for now
      return [];
    },
    enabled: !!currentCompany?.id
  });
};

export const useSupplyChainStats = () => {
  const { currentCompany } = useEnterprise();
  return useQuery({
    queryKey: ['supply_chain_stats', currentCompany?.id],
    queryFn: async () => {
      return {
        inTransit: 0,
        lowStock: 0,
        accuracy: 100
      };
    },
    enabled: !!currentCompany?.id
  });
};
