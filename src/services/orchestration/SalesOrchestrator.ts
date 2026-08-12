import { supabase } from '@/integrations/supabase/client';
import { useEventBus } from '@/core/events/useEventBus';

export class SalesOrchestrator {
  static async completeSale(orderId: string, companyId: string) {
    console.log(`[SalesOrchestrator] Completing sale: ${orderId}`);
    
    // 1. Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId);
      
    if (updateError) throw updateError;

    // 2. Publish Event
    const eventBus = useEventBus.getState();
    await eventBus.publish('SALE_COMPLETED', { orderId, companyId });
    
    return { success: true };
  }
}
