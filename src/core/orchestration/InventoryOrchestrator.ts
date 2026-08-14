import { useEventBus } from '@/core/events/useEventBus';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect, useRef, useCallback } from 'react';
import { toastSuccess } from '@/lib/toastHelpers';

export const useInventoryOrchestrator = (providedCompanyId?: string) => {
  const { currentCompany, isLoading: isContextLoading } = useEnterprise();
  const companyId = providedCompanyId || currentCompany?.id;
  const eventBus = useEventBus();
  const isSubscribed = useRef(false);

  // Define callback with useCallback to ensure stable reference
  const handleSaleCompleted = useCallback((payload: any) => {
    if (payload.companyId !== companyId) return;

    console.log('[InventoryOrchestrator] Sale completed, processing stock update', payload);
    toastSuccess(`Pedido ${payload.orderId.split('-')[0]} confirmado. Movimentação de estoque iniciada.`);
    
    // Use a delay to break the synchronous execution chain
    setTimeout(() => {
      eventBus.publish('STOCK_MOVED', { 
        orderId: payload.orderId, 
        type: 'SALE_OUT',
        companyId: payload.companyId 
      });
    }, 0);
  }, [companyId, eventBus]);

  useEffect(() => {
    if (!companyId || isContextLoading) return;
    
    console.log(`[InventoryOrchestrator] Subscribing to SALE_COMPLETED for company: ${companyId}`);
    const unsubscribe = eventBus.subscribe('SALE_COMPLETED', handleSaleCompleted);

    return () => {
      console.log(`[InventoryOrchestrator] Unsubscribing from SALE_COMPLETED for company: ${companyId}`);
      unsubscribe();
    };
  }, [companyId, eventBus, isContextLoading, handleSaleCompleted]);
};

