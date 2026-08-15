import { useEventBus } from '@/core/events/useEventBus';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect, useRef, useCallback } from 'react';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import { supabase } from '@/integrations/supabase/client';

/**
 * Inventory Orchestrator (SSOT)
 * 
 * Centraliza a orquestração de estoque do ERP.
 * P2 - Blindagem: Garante que toda movimentação de estoque seja rastreada e validada.
 */
export const useInventoryOrchestrator = (providedCompanyId?: string) => {
  const { currentCompany, isLoading: isContextLoading } = useEnterprise();
  const companyId = providedCompanyId || currentCompany?.id;
  const eventBus = useEventBus();
  
  const lastSubscribedCompanyId = useRef<string | null>(null);
  const isHandlingCleanup = useRef(false);

  /**
   * Registra movimentação no Ledger com Correlation Tracking
   */
  const logToLedger = useCallback(async (params: {
    movementId: string;
    previousStatus?: string;
    newStatus: string;
    correlationId?: string;
    causationId?: string;
    metadata?: any;
  }) => {
    if (!companyId) return;

    try {
      const { error } = await supabase
        .from('supply_chain_ledger')
        .insert({
          movement_id: params.movementId,
          previous_status: params.previousStatus,
          new_status: params.newStatus,
          company_id: companyId,
          correlation_id: params.correlationId,
          causation_id: params.causationId,
          metadata: params.metadata || {}
        });

      if (error) throw error;
    } catch (err) {
      console.error('[InventoryOrchestrator] Failed to log to ledger:', err);
    }
  }, [companyId]);

  const handleSaleCompleted = useCallback((payload: any) => {
    if (payload.companyId !== companyId) return;
    
    const correlationId = payload.correlationId || crypto.randomUUID();
    
    console.log('[InventoryOrchestrator] Sale completed, processing stock update', {
      orderId: payload.orderId,
      correlationId
    });

    toastSuccess(`Pedido ${payload.orderId.split('-')[0]} confirmado. Baixa de estoque em processamento.`);
    
    // Simulação de delay para processamento assíncrono (Event-Driven)
    setTimeout(() => {
      eventBus.publish('STOCK_MOVED', { 
        orderId: payload.orderId, 
        type: 'SALE_OUT',
        companyId: payload.companyId,
        correlationId,
        causationId: payload.causationId || payload.orderId
      });
    }, 0);
  }, [companyId, eventBus]);

  const handleTransferShipped = useCallback((payload: any) => {
    if (payload.companyId !== companyId) return;
    
    const correlationId = payload.correlationId;
    
    console.log('[InventoryOrchestrator] Transfer shipped, orchestrating fiscal emission', {
      transferId: payload.transferId,
      correlationId
    });

    // P4 - Logistics Integration: Auto NF-e on SHIPPED
    setTimeout(() => {
      eventBus.publish('FISCAL_OPERATION_REQUESTED', { 
        originId: payload.transferId,
        type: 'TRANSFER_OUT',
        companyId: payload.companyId,
        correlationId,
        causationId: payload.transferId
      });
    }, 0);
  }, [companyId, eventBus]);

  useEffect(() => {
    if (!companyId || isContextLoading) {
      lastSubscribedCompanyId.current = null;
      return;
    }

    if (lastSubscribedCompanyId.current === companyId) return;

    const currentId = companyId;
    lastSubscribedCompanyId.current = currentId;

    console.log(`[InventoryOrchestrator] SSOT Subscribing for company: ${currentId}`);
    const unsubscribeSale = eventBus.subscribe('SALE_COMPLETED', handleSaleCompleted);
    const unsubscribeTransfer = eventBus.subscribe('WORKFLOW_COMPLETED', (payload) => {
      if (payload.type === 'TRANSFER' && payload.status === 'EM TRÂNSITO') {
        handleTransferShipped({
          transferId: payload.transferId,
          companyId: payload.companyId,
          correlationId: payload.correlationId
        });
      }
    });

    return () => {
      if (isHandlingCleanup.current) return;
      isHandlingCleanup.current = true;
      
      unsubscribeSale();
      unsubscribeTransfer();
      
      setTimeout(() => {
        if (lastSubscribedCompanyId.current === currentId) {
          lastSubscribedCompanyId.current = null;
        }
        isHandlingCleanup.current = false;
      }, 100);
    };
  }, [companyId, eventBus, isContextLoading, handleSaleCompleted, handleTransferShipped]);

  return {
    logToLedger
  };
};
