import { useEventBus } from '@/core/events/useEventBus';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect, useRef } from 'react';
import { toastSuccess } from '@/lib/toastHelpers';

export const useInventoryOrchestrator = (providedCompanyId?: string) => {
  const { currentCompany, isLoading: isContextLoading } = useEnterprise();
  const companyId = providedCompanyId || currentCompany?.id;
  const eventBus = useEventBus();
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!companyId || isContextLoading || isSubscribed.current) return;

    isSubscribed.current = true;
    
    const unsubscribe = eventBus.subscribe('SALE_COMPLETED', (payload) => {
      if (payload.companyId !== companyId) return;

      console.log('[InventoryOrchestrator] Sale completed, processing stock update', payload);
      toastSuccess(`Pedido ${payload.orderId.split('-')[0]} confirmado. Movimentação de estoque iniciada.`);
      
      // Publish event without awaiting to avoid sync loops
      eventBus.publish('STOCK_MOVED', { 
        orderId: payload.orderId, 
        type: 'SALE_OUT',
        companyId: payload.companyId 
      });
    });

    return () => {
      unsubscribe();
      isSubscribed.current = false;
    };
  }, [companyId, eventBus, isContextLoading]);
};

