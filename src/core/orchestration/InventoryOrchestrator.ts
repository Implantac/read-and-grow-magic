import { useEventBus } from '@/core/events/useEventBus';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect } from 'react';
import { toastSuccess } from '@/lib/toastHelpers';

export const useInventoryOrchestrator = (providedCompanyId?: string) => {
  const { currentCompany } = useEnterprise();
  const companyId = providedCompanyId || currentCompany?.id;
  const eventBus = useEventBus();

  useEffect(() => {
    if (!companyId) return;

    // Quando uma venda é concluída, o estoque deve ser alertado para possível separação
    const unsubscribe = eventBus.subscribe('SALE_COMPLETED', async (payload) => {
      // Ignorar eventos de outras empresas
      if (payload.companyId !== companyId) return;

      console.log('[InventoryOrchestrator] Sale completed, processing stock update', payload);
      
      toastSuccess(`Pedido ${payload.orderId.split('-')[0]} confirmado. Movimentação de estoque iniciada.`);
      
      // Aqui poderiam ser disparados gatilhos de WMS ou PCP se necessário
      await eventBus.publish('STOCK_MOVED', { 
        orderId: payload.orderId, 
        type: 'SALE_OUT',
        companyId: payload.companyId 
      });
    });

    return () => unsubscribe();
  }, [companyId, eventBus]);
};
