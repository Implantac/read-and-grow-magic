import { useEventBus } from '@/core/events/useEventBus';
import { useEnterprise } from '@/core/auth/EnterpriseContext';
import { useEffect } from 'react';
import { toastInfo } from '@/lib/toastHelpers';

export const useInventoryOrchestrator = () => {
  const { currentCompany } = useEnterprise();
  const eventBus = useEventBus();

  useEffect(() => {
    if (!currentCompany) return;

    // Quando uma venda é concluída, o estoque deve ser alertado para possível separação
    const unsubscribe = eventBus.subscribe('SALE_COMPLETED', async (payload) => {
      console.log('[InventoryOrchestrator] Sale completed, processing stock update', payload);
      
      toastInfo(`Pedido ${payload.orderId.split('-')[0]} confirmado. Movimentação de estoque iniciada.`);
      
      // Aqui poderiam ser disparados gatilhos de WMS ou PCP se necessário
      await eventBus.publish('STOCK_MOVED', { 
        orderId: payload.orderId, 
        type: 'SALE_OUT',
        companyId: payload.companyId 
      });
    });

    return () => unsubscribe();
  }, [currentCompany, eventBus]);
};
