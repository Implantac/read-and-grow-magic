import { useEventBus } from '@/core/events/useEventBus';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect, useRef, useCallback } from 'react';
import { toastSuccess } from '@/lib/toastHelpers';

export const useInventoryOrchestrator = (providedCompanyId?: string) => {
  const { currentCompany, isLoading: isContextLoading } = useEnterprise();
  const companyId = providedCompanyId || currentCompany?.id;
  const eventBus = useEventBus();
  
  // Use a ref to track the last companyId we subscribed for to prevent duplicates
  const lastSubscribedCompanyId = useRef<string | null>(null);

  const handleSaleCompleted = useCallback((payload: any) => {
    // Strict company check
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
    if (!companyId || isContextLoading) return;
    if (lastSubscribedCompanyId.current === companyId) return;

    lastSubscribedCompanyId.current = companyId;
    console.log(`[InventoryOrchestrator] Subscribing to SALE_COMPLETED for company: ${companyId}`);
    const unsubscribe = eventBus.subscribe('SALE_COMPLETED', handleSaleCompleted);

    return () => {
      console.log(`[InventoryOrchestrator] Unsubscribing from SALE_COMPLETED for company: ${companyId}`);
      unsubscribe();
      lastSubscribedCompanyId.current = null;
    };
  }, [companyId, eventBus, isContextLoading, handleSaleCompleted]);
};

