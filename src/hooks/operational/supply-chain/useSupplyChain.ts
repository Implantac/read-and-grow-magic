import { useState, useEffect } from 'react';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { supplyChainService, SupplyChainMovement, MovementStatus } from '@/services/operational/supply-chain/supplyChainService';
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useSupplyChain(filters?: { status?: MovementStatus[] }) {
  const { currentBranch, isLoading: isEnterpriseLoading } = useEnterprise();
  const [movements, setMovements] = useState<SupplyChainMovement[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const fetchMovements = async () => {
    if (!currentBranch?.id) return;
    
    setIsDataLoading(true);
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
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (!isEnterpriseLoading && currentBranch?.id) {
      fetchMovements();
    }
  }, [currentBranch?.id, JSON.stringify(filters?.status), isEnterpriseLoading]);

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

  const getMovementLedger = async (movementId: string) => {
    try {
      const { data, error } = await supabase
        .from('supply_chain_ledger' as any)
        .select('*')
        .eq('movement_id', movementId)
        .order('created_at', { ascending: false });

      if (error) {
        // Se a tabela não existir, retorna array vazio silenciosamente para não quebrar a UI
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.warn('supply_chain_ledger table not found, skipping history');
          return [];
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching ledger:', error);
      return [];
    }
  };

  return {
    movements,
    isLoading: isEnterpriseLoading || isDataLoading,
    refresh: fetchMovements,
    updateStatus,
    getMovementLedger
  };
}
