import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { LIST_LIMIT } from "@/lib/queryLimits";

export type MovementStatus = Database['public']['Tables']['supply_chain_movements']['Row']['status'];
export type SupplyChainMovement = Database['public']['Tables']['supply_chain_movements']['Row'];
export type SupplyChainItem = Database['public']['Tables']['supply_chain_items']['Row'];

export const supplyChainService = {
  async getMovements(filters: {
    unit_id?: string;
    role?: 'origin' | 'destination' | 'both';
    status?: MovementStatus[];
  }): Promise<SupplyChainMovement[]> {
    let query = supabase
      .from('supply_chain_movements')
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

    const { data, error } = await query.order('created_at', { ascending: false }).limit(LIST_LIMIT);
    
    if (error) {
      console.error('Error fetching movements:', error);
      return [];
    }
    
    return data || [];
  },

  async createRequest(request: Database['public']['Tables']['supply_chain_movements']['Insert'] & { items: Database['public']['Tables']['supply_chain_items']['Insert'][] }) {
    const { data: movement, error: mError } = await supabase
      .from('supply_chain_movements')
      .insert({
        origin_id: request.origin_id,
        origin_type: request.origin_type,
        destination_id: request.destination_id,
        destination_type: request.destination_type,
        company_id: request.company_id,
        status: 'requested',
        priority: request.priority || 'normal',
        items_count: request.items.length
      })
      .select()
      .single();

    if (mError) throw mError;

    const itemsToInsert = request.items.map(item => ({
      ...item,
      movement_id: movement.id
    }));

    const { error: iError } = await supabase
      .from('supply_chain_items')
      .insert(itemsToInsert);

    if (iError) throw iError;

    return movement;
  },

  async updateStatus(id: string, status: MovementStatus) {
    const { data, error } = await supabase
      .from('supply_chain_movements')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
