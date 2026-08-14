import { useEventBus } from '@/core/events/useEventBus';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect, useCallback, useRef } from 'react';
import { toastSuccess } from '@/lib/toastHelpers';

export const useFinancialOrchestrator = (providedCompanyId?: string) => {
  const { currentCompany, isLoading: isContextLoading } = useEnterprise();
  const companyId = providedCompanyId || currentCompany?.id;
  const eventBus = useEventBus();
  const lastSubscribedCompanyId = useRef<string | null>(null);

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

    let unsubscribe: (() => void) | null = null;
    const currentId = companyId;
    lastSubscribedCompanyId.current = currentId;

    console.log(`[FinancialOrchestrator] Subscribing to SALE_COMPLETED for company: ${currentId}`);
    unsubscribe = eventBus.subscribe('SALE_COMPLETED', handleSaleCompleted);

    return () => {
      if (unsubscribe) {
        console.log(`[FinancialOrchestrator] Unsubscribing from SALE_COMPLETED for company: ${currentId}`);
        unsubscribe();
      }
      if (lastSubscribedCompanyId.current === currentId) {
        lastSubscribedCompanyId.current = null;
      }
    };
  }, [companyId, eventBus, isContextLoading, handleSaleCompleted]);
};
