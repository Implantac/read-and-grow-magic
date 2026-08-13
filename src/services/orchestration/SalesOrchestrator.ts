import { supabase } from '@/integrations/supabase/client';
import { useEventBus } from '@/core/events/useEventBus';
import { toastSuccess } from '@/lib/toastHelpers';

export class SalesOrchestrator {
  static async completeSale(orderId: string, companyId: string) {
    console.log(`[SalesOrchestrator] Completing sale: ${orderId}`);
    
    // 1. Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId);
      
    if (updateError) throw updateError;
    
    toastSuccess('Venda Concluída', `O pedido ${orderId.split('-')[0]} foi processado pelo orquestrador.`);

    // 2. Publish Event
    // Note: useEventBus.getState() is correct for zustand to get current state without hook
    const eventBus = useEventBus.getState();
    await eventBus.publish('SALE_COMPLETED', { orderId, companyId });
    
    return { success: true };
  }
}
