import { useEventBus } from '@/core/events/useEventBus';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect, useRef } from 'react';
import { toastSuccess } from '@/lib/toastHelpers';

export const useFinancialOrchestrator = (providedCompanyId?: string) => {
  const { currentCompany, isLoading: isContextLoading } = useEnterprise();
  const companyId = providedCompanyId || currentCompany?.id;
  const eventBus = useEventBus();

  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!companyId || isContextLoading || isSubscribed.current) return;

    isSubscribed.current = true;
    
    // Quando uma venda é concluída, o financeiro gera o contas a receber
    const unsubscribe = eventBus.subscribe('SALE_COMPLETED', (payload) => {
      // Ignorar eventos de outras empresas
      if (payload.companyId !== companyId) return;

      console.log('[FinancialOrchestrator] Sale completed, generating ledger entry', payload);
      
      toastSuccess(`Título financeiro gerado para o pedido ${payload.orderId.split('-')[0]}.`);
      
      // Publicar de forma assíncrona para evitar ciclos síncronos, 
      // embora o EventBus já faça isso via setTimeout
      eventBus.publish('PAYMENT_SETTLED', { 
        orderId: payload.orderId,
        status: 'PENDING',
        companyId: payload.companyId 
      });
    });

    return () => {
      unsubscribe();
      isSubscribed.current = false;
    };
  }, [companyId, eventBus, isContextLoading]);
};
