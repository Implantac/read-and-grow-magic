import { useEventBus } from '@/core/events/useEventBus';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect, useCallback } from 'react';
import { toastSuccess } from '@/lib/toastHelpers';

export const useFinancialOrchestrator = (providedCompanyId?: string) => {
  const { currentCompany, isLoading: isContextLoading } = useEnterprise();
  const companyId = providedCompanyId || currentCompany?.id;
  const eventBus = useEventBus();

  const handleSaleCompleted = useCallback((payload: any) => {
    // Ignorar eventos de outras empresas
    if (payload.companyId !== companyId) return;

    console.log('[FinancialOrchestrator] Sale completed, generating ledger entry', payload);
    
    toastSuccess(`Título financeiro gerado para o pedido ${payload.orderId.split('-')[0]}.`);
    
    queueMicrotask(() => {
      eventBus.publish('PAYMENT_SETTLED', { 
        orderId: payload.orderId,
        status: 'PENDING',
        companyId: payload.companyId 
      });
    });
  }, [companyId, eventBus]);

  useEffect(() => {
    if (!companyId || isContextLoading) return;
    
    console.log(`[FinancialOrchestrator] Subscribing to SALE_COMPLETED for company: ${companyId}`);
    const unsubscribe = eventBus.subscribe('SALE_COMPLETED', handleSaleCompleted);

    return () => {
      console.log(`[FinancialOrchestrator] Unsubscribing from SALE_COMPLETED for company: ${companyId}`);
      unsubscribe();
    };
  }, [companyId, eventBus, isContextLoading, handleSaleCompleted]);
};
