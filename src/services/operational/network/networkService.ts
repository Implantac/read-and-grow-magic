import { supabase } from '@/integrations/supabase/client';

export class NetworkService {
  /**
   * POS Terminals
   */
  async getPosTerminals(branchId?: string) {
    let query = supabase.from('pos_terminals' as any).select('*');
    if (branchId) query = query.eq('branch_id', branchId);
    const { data, error } = await query.order('code');
    if (error) throw error;
    return (data || []) as any[];
  }

  async createPosTerminal(terminal: any) {
    const { data, error } = await supabase.from('pos_terminals' as any).insert(terminal).select().single();
    if (error) throw error;
    return data;
  }

  /**
   * Stock Transfer Orders
   */
  async getTransferOrders(options: { companyId: string; branchId?: string }) {
    let query = supabase
      .from('stock_transfer_orders' as any)
      .select(`
        *,
        origin:branches!origin_unit_id(name),
        destination:branches!destination_unit_id(name)
      `)
      .eq('company_id', options.companyId);
    
    if (options.branchId) {
      query = (query as any).or(`origin_unit_id.eq.${options.branchId},destination_unit_id.eq.${options.branchId}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as any[];
  }

  async getTransferOrderDetails(orderId: string) {
    const { data, error } = await supabase
      .from('stock_transfer_items' as any)
      .select('*, product:products(name, code, unit)')
      .eq('transfer_id', orderId);
    if (error) throw error;
    return (data || []) as any[];
  }

  async createTransferOrder(
    order: any,
    items: any[]
  ) {
    const { data: header, error: headerError } = await supabase
      .from('stock_transfer_orders' as any)
      .insert(order)
      .select()
      .single();
    
    if (headerError) throw headerError;

    const itemsWithOrderId = items.map(item => ({ ...item, transfer_id: (header as any).id }));
    const { error: itemsError } = await supabase.from('stock_transfer_items' as any).insert(itemsWithOrderId);
    
    if (itemsError) {
      await supabase.from('stock_transfer_orders' as any).delete().eq('id', (header as any).id);
      throw itemsError;
    }

    return header;
  }

  /**
   * Replenishment Policies
   */
  async getReplenishmentPolicies(branchId: string) {
    const { data, error } = await supabase
      .from('replenishment_policies' as any)
      .select('*, product:products(name, code)')
      .eq('branch_id', branchId);
    if (error) throw error;
    return (data || []) as any[];
  }

  async upsertReplenishmentPolicy(policy: any) {
    const { data, error } = await supabase
      .from('replenishment_policies' as any)
      .upsert(policy, { onConflict: 'branch_id,product_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export const networkService = new NetworkService();
