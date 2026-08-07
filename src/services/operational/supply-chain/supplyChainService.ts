import { supabase } from "@/integrations/supabase/client";

export type MovementStatus = 
  | 'requested'   // SOLICITADA
  | 'approved'    // APROVADA
  | 'reserved'    // RESERVADA
  | 'picking'     // EM SEPARAÇÃO
  | 'shipped'     // EXPEDIDA
  | 'in_transit'  // EM TRÂNSITO
  | 'delivered'   // RECEBIDA
  | 'checked'     // CONFERIDA
  | 'divergent'   // DIVERGÊNCIA
  | 'completed'   // CONCLUÍDA
  | 'investigating'; // INVESTIGAÇÃO

export type UnitType = 'factory' | 'warehouse' | 'store' | 'customer';

export interface SupplyChainMovement {
  id: string;
  origin_id: string;
  origin_type: UnitType;
  destination_id: string;
  destination_type: UnitType;
  company_id: string;
  status: MovementStatus;
  priority: 'low' | 'normal' | 'high' | 'critical';
  items_count: number;
  created_at: string;
  updated_at: string;
  estimated_arrival?: string;
  external_ref?: string;
}

export interface SupplyChainItem {
  id: string;
  movement_id: string;
  product_id: string;
  requested_qty: number;
  shipped_qty?: number;
  received_qty?: number;
  unit_price?: number;
}

export const supplyChainService = {
  async getMovements(filters: {
    unit_id?: string;
    role?: 'origin' | 'destination' | 'both';
    status?: MovementStatus[];
  }): Promise<SupplyChainMovement[]> {
    let query = supabase
      .from('supply_chain_movements' as any)
      .select('*');

    if (filters.unit_id) {
      if (filters.role === 'origin') {
        query = query.eq('origin_id', filters.unit_id);
      } else if (filters.role === 'destination') {
        query = query.eq('destination_id', filters.unit_id);
      } else {
        query = query.or(`origin_id.eq.${filters.unit_id},destination_id.eq.${filters.unit_id}`);
      }
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching movements:', error);
      return [];
    }
    
    return data as any[];
  },

  async createRequest(request: Partial<SupplyChainMovement> & { items: Partial<SupplyChainItem>[] }) {
    // In a real scenario, this would be a single transaction or RPC
    const { data: movement, error: mError } = await supabase
      .from('supply_chain_movements' as any)
      .insert({
        ...request,
        status: 'requested',
        items: undefined // Remove items from movement object
      })
      .select()
      .single();

    if (mError) throw mError;

    const items = request.items.map(item => ({
      ...item,
      movement_id: movement.id
    }));

    const { error: iError } = await supabase
      .from('supply_chain_items' as any)
      .insert(items);

    if (iError) throw iError;

    return movement;
  },

  async updateStatus(movementId: string, status: MovementStatus) {
    const { error } = await supabase
      .from('supply_chain_movements' as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', movementId);
    
    if (error) throw error;
  }
};
