import { supabase } from '@/integrations/supabase/client';

export type SourcingType = 'local' | 'crossdock' | 'dropshipping';

export interface SourcingOption {
  type: SourcingType;
  branchId?: string;
  vendorId?: string;
  leadTimeDays: number;
  cost: number;
  stockAvailable: number;
}

export class OrchestrationService {
  /**
   * Calculate sourcing options for a given product and quantity
   */
  async getSourcingOptions(productId: string, quantity: number, targetBranchId: string): Promise<SourcingOption[]> {
    const options: SourcingOption[] = [];

    // Use a generic query to avoid TS deep instantiation issues with complex generated types
    // 1. Check local stock
    const { data: localStock } = await supabase
      .from('stock_balances')
      .select('quantity')
      .eq('product_id', productId as any)
      .eq('branch_id', targetBranchId as any)
      .single();

    if (localStock && (localStock as any).quantity >= quantity) {
      options.push({
        type: 'local',
        branchId: targetBranchId,
        leadTimeDays: 0,
        cost: 0,
        stockAvailable: (localStock as any).quantity
      });
    }

    // 2. Check network stock (Cross-docking candidate)
    const { data: networkStock } = await supabase
      .from('stock_balances')
      .select('branch_id, quantity')
      .eq('product_id', productId as any)
      .neq('branch_id', targetBranchId as any)
      .gt('quantity', 0);

    if (networkStock) {
      (networkStock as any[]).forEach(item => {
        options.push({
          type: 'crossdock',
          branchId: item.branch_id,
          leadTimeDays: 2,
          cost: 15.00,
          stockAvailable: item.quantity as number
        });
      });
    }

    return options.sort((a, b) => a.leadTimeDays - b.leadTimeDays);
  }

  /**
   * Create an orchestrated order
   */
  async createOrchestratedOrder(orderData: any, sourcing: SourcingOption) {
    const { data: order, error } = await supabase
      .from('storefront_orders')
      .insert({
        ...orderData,
        metadata: { 
          sourcing_type: sourcing.type,
          sourcing_origin_id: sourcing.branchId || sourcing.vendorId
        }
      })
      .select()
      .single();

    if (error) throw error;

    if (sourcing.type === 'crossdock') {
      await supabase.from('stock_movements' as any).insert({
        company_id: order.company_id,
        origin_unit_id: sourcing.branchId,
        destination_unit_id: orderData.branch_id,
        status: 'pending',
        metadata: { related_order_id: (order as any).id }
      });
    }

    return order;
  }
}

export const orchestrationService = new OrchestrationService();
