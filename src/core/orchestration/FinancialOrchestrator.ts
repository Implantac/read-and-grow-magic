import { useEventBus } from '@/core/events/useEventBus';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect } from 'react';
import { toastSuccess } from '@/lib/toastHelpers';

export const useFinancialOrchestrator = (providedCompanyId?: string) => {
  const { currentCompany } = useEnterprise();
  const companyId = providedCompanyId || currentCompany?.id;
  const eventBus = useEventBus();

  useEffect(() => {
    if (!companyId) return;

    // Quando uma venda é concluída, o financeiro gera o contas a receber
    const unsubscribe = eventBus.subscribe('SALE_COMPLETED', async (payload) => {
      // Ignorar eventos de outras empresas
      if (payload.companyId !== companyId) return;

      console.log('[FinancialOrchestrator] Sale completed, generating ledger entry', payload);
      
      toastSuccess(`Título financeiro gerado para o pedido ${payload.orderId.split('-')[0]}.`);
      
      await eventBus.publish('PAYMENT_SETTLED', { 
        orderId: payload.orderId,
        status: 'PENDING',
        companyId: payload.companyId 
      });
    });

    return () => unsubscribe();
  }, [companyId, eventBus]);
};
