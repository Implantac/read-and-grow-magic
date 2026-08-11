import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type UnitType = Database['public']['Enums']['app_role'] | 'factory' | 'distribution_center' | 'store' | 'office';

export type OperationalUnit = Database['public']['Tables']['operational_units']['Row'];
export type StockBalance = Database['public']['Tables']['stock_balances']['Row'];
export type SupplyChainMovement = Database['public']['Tables']['supply_chain_movements']['Row'];

export interface StockTransfer extends SupplyChainMovement {
  origin?: { name: string };
  destination?: { name: string };
}

export const networkService = {
  async getOperationalUnits(companyId: string): Promise<OperationalUnit[]> {
    const { data, error } = await supabase
      .from('operational_units')
      .select('*')
      .eq('company_id', companyId)
      .limit(100);
    
    if (error) throw error;
    return data || [];
  },

  async getStockBalances(companyId: string, unitId?: string): Promise<StockBalance[]> {
    let query = supabase
      .from('stock_balances')
      .select('*, operational_units(name), stock_locations(name), products(name, code)')
      .eq('company_id', companyId)
      .limit(1000);
    
    if (unitId) {
      query = query.eq('branch_id', unitId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createTransfer(params: Database['public']['Tables']['supply_chain_movements']['Insert']) {
    const { data, error } = await supabase
      .from('supply_chain_movements')
      .insert([params])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTransferStatus(transferId: string, status: Database['public']['Tables']['supply_chain_movements']['Update']['status']) {
    const { data, error } = await supabase
      .from('supply_chain_movements')
      .update({ status })
      .eq('id', transferId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getTransfers(companyId: string): Promise<StockTransfer[]> {
    const { data, error } = await supabase
      .from('supply_chain_movements')
      .select(`
        *,
        origin:operational_units!origin_id(name),
        destination:operational_units!destination_id(name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    return (data || []) as StockTransfer[];
  },

  async getPosTerminals(unitId: string) {
    const { data, error } = await supabase
      .from('pos_terminals')
      .select('*')
      .eq('branch_id', unitId)
      .limit(50);
    
    if (error) throw error;
    return data || [];
  }
};
