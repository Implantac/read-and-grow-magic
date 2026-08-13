import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { supplyChainService, SupplyChainMovement, MovementStatus } from '@/services/operational/supply-chain/supplyChainService';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

export function useSupplyChain(filters?: { status?: MovementStatus[] }) {
  const { currentBranch, isLoading: isEnterpriseLoading } = useEnterprise();
  const [movements, setMovements] = useState<SupplyChainMovement[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const branchId = currentBranch?.id;
  const statusFilter = useMemo(() => filters?.status, [JSON.stringify(filters?.status)]);

  const fetchMovements = useCallback(async () => {
    if (!branchId) return;
    
    setIsDataLoading(true);
    try {
      const data = await supplyChainService.getMovements({
        unit_id: branchId,
        status: statusFilter
      });
      setMovements(data);
    } catch (error) {
      console.error('Error in useSupplyChain:', error);
      toast.error('Erro ao carregar movimentações');
    } finally {
      setIsDataLoading(false);
    }
  }, [branchId, statusFilter]);

  useEffect(() => {
    if (!isEnterpriseLoading && branchId) {
      fetchMovements();
    }
  }, [branchId, isEnterpriseLoading, fetchMovements]);

  useEffect(() => {
    if (isEnterpriseLoading || !branchId) return;

    const channelName = `supply_chain_movements_${branchId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supply_chain_movements'
        },
        (payload) => {
          console.log('Supply Chain Realtime Update:', payload);
          fetchMovements();
          if (payload.eventType === 'INSERT') {
            toast.success('Nova movimentação detectada e lista atualizada.');
          } else {
            toast.info('A lista de movimentações foi atualizada.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId, isEnterpriseLoading, fetchMovements]);

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