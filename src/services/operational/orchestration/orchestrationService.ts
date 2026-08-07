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

    // 1. Check local stock
    const { data: localStock } = await supabase
      .from('inventory_levels')
      .select('balance')
      .eq('product_id', productId)
      .eq('branch_id', targetBranchId)
      .single();

    if (localStock && localStock.balance >= quantity) {
      options.push({
        type: 'local',
        branchId: targetBranchId,
        leadTimeDays: 0,
        cost: 0,
        stockAvailable: localStock.balance
      });
    }

    // 2. Check network stock (Cross-docking candidate)
    const { data: networkStock } = await supabase
      .from('inventory_levels')
      .select('branch_id, balance, branches(name)')
      .eq('product_id', productId)
      .neq('branch_id', targetBranchId)
      .gt('balance', 0);

    if (networkStock) {
      networkStock.forEach(item => {
        options.push({
          type: 'crossdock',
          branchId: item.branch_id,
          leadTimeDays: 2, // Hardcoded for now, should be based on distance/logistics
          cost: 15.00, // Hardcoded transfer cost
          stockAvailable: item.balance
        });
      });
    }

    return options.sort((a, b) => a.leadTimeDays - b.leadTimeDays);
  }

  /**
   * Create an orchestrated order
   */
  async createOrchestratedOrder(orderData: any, sourcing: SourcingOption) {
    // This would involve creating the sales order AND the related logistics entity (Transfer or PO)
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
      // Create automatic stock transfer order
      await supabase.from('stock_transfer_orders').insert({
        company_id: order.company_id,
        origin_unit_id: sourcing.branchId,
        destination_unit_id: orderData.branch_id,
        status: 'pending',
        metadata: { related_order_id: order.id }
      });
    }

    return order;
  }
}

export const orchestrationService = new OrchestrationService();
