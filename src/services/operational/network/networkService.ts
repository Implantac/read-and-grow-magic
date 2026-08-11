import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type UnitType = Database['public']['Enums']['app_role'] | 'factory' | 'distribution_center' | 'store' | 'office';

export type OperationalUnit = Database['public']['Tables']['operational_units']['Row'];
export type StockBalance = Database['public']['Tables']['stock_balances']['Row'];
export type SupplyChainMovement = Database['public']['Tables']['supply_chain_movements']['Row'];

export interface StockTransfer extends SupplyChainMovement {
  origin?: { name: string } | null;
  destination?: { name: string } | null;
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
      .select('*, branches(name), stock_locations(name), products(name, code)')
      .eq('company_id', companyId)
      .limit(1000);
    
    if (unitId) {
      query = query.eq('branch_id', unitId);
    }

    const { data, error } = await query;
    if (error) throw error;
    // Usamos unknown as any para evitar problemas de tipos com o join de branches
    return (data || []) as unknown as StockBalance[];
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
        origin:branches!supply_chain_movements_origin_id_fkey(name),
        destination:branches!supply_chain_movements_destination_id_fkey(name)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('supply_chain_movements')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (fallbackError) throw fallbackError;
      return (fallbackData || []) as StockTransfer[];
    }
    
    return (data || []) as unknown as StockTransfer[];
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
