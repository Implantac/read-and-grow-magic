import { useState, useEffect } from 'react';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { supplyChainService, SupplyChainMovement, MovementStatus } from '@/services/operational/supply-chain/supplyChainService';
import { toast } from 'sonner';

export function useSupplyChain(filters?: { status?: MovementStatus[] }) {
  const { currentBranch } = useEnterprise();
  const [movements, setMovements] = useState<SupplyChainMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMovements = async () => {
    if (!currentBranch?.id) return;
    
    setIsLoading(true);
    try {
      const data = await supplyChainService.getMovements({
        unit_id: currentBranch.id,
        status: filters?.status
      });
      setMovements(data);
    } catch (error) {
      console.error('Error in useSupplyChain:', error);
      toast.error('Erro ao carregar movimentações');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [currentBranch?.id, JSON.stringify(filters?.status)]);

  const updateStatus = async (id: string, status: MovementStatus) => {
    try {
      await supplyChainService.updateStatus(id, status);
      toast.success('Status atualizado com sucesso');
      fetchMovements();
    } catch (error) {
      toast.error('Erro ao atualizar status');
      throw error;
    }
  };

  return {
    movements,
    isLoading,
    refresh: fetchMovements,
    updateStatus
  };
}
