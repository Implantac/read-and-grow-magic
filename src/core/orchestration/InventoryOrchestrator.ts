import { useEventBus } from '@/core/events/useEventBus';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect, useRef, useCallback } from 'react';
import { toastSuccess } from '@/lib/toastHelpers';

export const useInventoryOrchestrator = (providedCompanyId?: string) => {
  const { currentCompany, isLoading: isContextLoading } = useEnterprise();
  const companyId = providedCompanyId || currentCompany?.id;
  const eventBus = useEventBus();
  
  const lastSubscribedCompanyId = useRef<string | null>(null);
  const isHandlingCleanup = useRef(false);

  const handleSaleCompleted = useCallback((payload: any) => {
    if (payload.companyId !== companyId) return;
    console.log('[InventoryOrchestrator] Sale completed, processing stock update', payload);
    toastSuccess(`Pedido ${payload.orderId.split('-')[0]} confirmado. Movimentação de estoque iniciada.`);
    
    setTimeout(() => {
      eventBus.publish('STOCK_MOVED', { 
        orderId: payload.orderId, 
        type: 'SALE_OUT',
        companyId: payload.companyId 
      });
    }, 0);
  }, [companyId, eventBus]);

  useEffect(() => {
    // Break cycle if context is resetting or loading
    if (!companyId || isContextLoading) {
      lastSubscribedCompanyId.current = null;
      return;
    }

    // Idempotency check
    if (lastSubscribedCompanyId.current === companyId) return;

    const currentId = companyId;
    lastSubscribedCompanyId.current = currentId;

    console.log(`[InventoryOrchestrator] Subscribing for company: ${currentId}`);
    const unsubscribe = eventBus.subscribe('SALE_COMPLETED', handleSaleCompleted);

    return () => {
      if (isHandlingCleanup.current) return;
      isHandlingCleanup.current = true;
      
      console.log(`[InventoryOrchestrator] Unsubscribing for company: ${currentId}`);
      unsubscribe();
      
      // Reset after a small delay to allow React state to settle
      setTimeout(() => {
        if (lastSubscribedCompanyId.current === currentId) {
          lastSubscribedCompanyId.current = null;
        }
        isHandlingCleanup.current = false;
      }, 100);
    };
  }, [companyId, eventBus, isContextLoading, handleSaleCompleted]);
};

