import { useState, useEffect } from 'react';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { networkService, type OperationalUnit } from '@/services/operational/network/networkService';
import { toast } from 'sonner';

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
