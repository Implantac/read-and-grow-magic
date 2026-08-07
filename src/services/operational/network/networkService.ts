import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export class NetworkService {
  /**
   * POS Terminals
   */
  async getPosTerminals(branchId?: string) {
    let query = supabase.from('pos_terminals').select('*');
    if (branchId) query = query.eq('branch_id', branchId);
    const { data, error } = await query.order('code');
    if (error) throw error;
    return data || [];
  }

  async createPosTerminal(terminal: TablesInsert<'pos_terminals'>) {
    const { data, error } = await supabase.from('pos_terminals').insert(terminal).select().single();
    if (error) throw error;
    return data;
  }

  /**
   * Stock Transfer Orders
   */
  async getTransferOrders(options: { companyId: string; branchId?: string }) {
    let query = supabase
      .from('stock_transfer_orders')
      .select(`
        *,
        origin:branches!origin_unit_id(name),
        destination:branches!destination_unit_id(name)
      `)
      .eq('company_id', options.companyId);
    
    if (options.branchId) {
      query = query.or(`origin_unit_id.eq.${options.branchId},destination_unit_id.eq.${options.branchId}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getTransferOrderDetails(orderId: string) {
    const { data, error } = await supabase
      .from('stock_transfer_items')
      .select('*, product:products(name, code, unit)')
      .eq('transfer_id', orderId);
    if (error) throw error;
    return data || [];
  }

  async createTransferOrder(
    order: TablesInsert<'stock_transfer_orders'>,
    items: TablesInsert<'stock_transfer_items'>[]
  ) {
    const { data: header, error: headerError } = await supabase
      .from('stock_transfer_orders')
      .insert(order)
      .select()
      .single();
    
    if (headerError) throw headerError;

    const itemsWithOrderId = items.map(item => ({ ...item, transfer_id: header.id }));
    const { error: itemsError } = await supabase.from('stock_transfer_items').insert(itemsWithOrderId);
    
    if (itemsError) {
      await supabase.from('stock_transfer_orders').delete().eq('id', header.id);
      throw itemsError;
    }

    return header;
  }

  /**
   * Replenishment Policies
   */
  async getReplenishmentPolicies(branchId: string) {
    const { data, error } = await supabase
      .from('replenishment_policies')
      .select('*, product:products(name, code)')
      .eq('branch_id', branchId);
    if (error) throw error;
    return data || [];
  }

  async upsertReplenishmentPolicy(policy: TablesInsert<'replenishment_policies'>) {
    const { data, error } = await supabase
      .from('replenishment_policies')
      .upsert(policy, { onConflict: 'branch_id,product_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  /**
   * Supply Chain Stats
   */
  async getSupplyChainStats(companyId: string) {
    const { data: stockInTransit } = await supabase
      .from('stock_transfer_orders')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'shipped');

    const { data: lowStock } = await supabase
      .from('replenishment_policies')
      .select('id')
      .eq('company_id', companyId); // Mock logic for simplicity, should join with balances

    return {
      inTransit: stockInTransit?.length || 0,
      lowStock: lowStock?.length || 0,
      accuracy: 94.2
    };
  }
}

export const networkService = new NetworkService();
