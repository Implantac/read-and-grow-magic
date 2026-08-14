import { supabase } from '@/integrations/supabase/client';
import { useEventBus } from '@/core/events/useEventBus';
import { toastSuccess } from '@/lib/toastHelpers';

export class SalesOrchestrator {
  static async completeSale(orderId: string, companyId: string) {
    const correlationId = crypto.randomUUID();
    console.log(`[SalesOrchestrator] Completing sale: ${orderId} (Correlation: ${correlationId})`);
    
    // 1. Update order status and propagate correlation
    const { error: updateError } = await (supabase as any)
      .from('orders')
      .update({ 
        status: 'completed',
        correlation_id: correlationId
      })
      .eq('id', orderId);
      
    if (updateError) throw updateError;
    
    toastSuccess('Venda Concluída', `O pedido ${orderId.split('-')[0]} foi processado pelo orquestrador.`);

    // 2. Publish Event with Correlation
    const eventBus = useEventBus.getState();
    await eventBus.publish('SALE_COMPLETED', { 
      orderId, 
      companyId,
      correlationId,
      causationId: orderId
    });
    
    return { success: true };
  }
}
