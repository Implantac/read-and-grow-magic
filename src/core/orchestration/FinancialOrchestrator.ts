import { useEventBus } from '@/core/events/useEventBus';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect, useCallback, useRef } from 'react';
import { toastSuccess } from '@/lib/toastHelpers';

export const useFinancialOrchestrator = (providedCompanyId?: string) => {
  const { currentCompany, isLoading: isContextLoading } = useEnterprise();
  const companyId = providedCompanyId || currentCompany?.id;
  const eventBus = useEventBus();
  
  const lastSubscribedCompanyId = useRef<string | null>(null);
  const isHandlingCleanup = useRef(false);

  const handleSaleCompleted = useCallback((payload: any) => {
    if (payload.companyId !== companyId) return;
    console.log('[FinancialOrchestrator] Sale completed, generating ledger entry', payload);
    toastSuccess(`Título financeiro gerado para o pedido ${payload.orderId.split('-')[0]}.`);
    
    setTimeout(() => {
      eventBus.publish('PAYMENT_SETTLED', { 
        orderId: payload.orderId,
        status: 'PENDING',
        companyId: payload.companyId 
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

    console.log(`[FinancialOrchestrator] Subscribing for company: ${currentId}`);
    const unsubscribe = eventBus.subscribe('SALE_COMPLETED', handleSaleCompleted);

    return () => {
      if (isHandlingCleanup.current) return;
      isHandlingCleanup.current = true;

      console.log(`[FinancialOrchestrator] Unsubscribing for company: ${currentId}`);
      unsubscribe();

      setTimeout(() => {
        if (lastSubscribedCompanyId.current === currentId) {
          lastSubscribedCompanyId.current = null;
        }
        isHandlingCleanup.current = false;
      }, 100);
    };
  }, [companyId, eventBus, isContextLoading, handleSaleCompleted]);
};
