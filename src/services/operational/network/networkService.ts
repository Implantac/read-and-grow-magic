import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type UnitType = 'factory' | 'distribution_center' | 'store' | 'office';

export interface OperationalUnit {
  id: string;
  company_id: string;
  name: string;
  type: UnitType;
  document_number?: string;
  is_active: boolean;
  settings?: any;
}

export interface StockTransfer {
  id: string;
  company_id: string;
  origin_unit_id: string;
  destination_unit_id: string;
  status: 'draft' | 'requested' | 'approved' | 'picking' | 'shipped' | 'in_transit' | 'received' | 'checked' | 'completed';
  reference_number: string;
  created_at: string;
  origin?: { name: string };
  destination?: { name: string };
}

export const networkService = {
  async getOperationalUnits(companyId: string) {
    const { data, error } = await supabase
      .from('operational_units' as any)
      .select('*')
      .eq('company_id', companyId);
    
    if (error) throw error;
    return (data || []) as unknown as OperationalUnit[];
  },

  async getStockBalances(companyId: string, unitId?: string) {
    let query = supabase
      .from('stock_balances' as any)
      .select('*, operational_units(name), stock_locations(name), products(name, code)')
      .eq('company_id', companyId);
    
    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createTransfer(params: Omit<StockTransfer, 'id' | 'created_at' | 'reference_number'>) {
    const ref = `TRF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const { data, error } = await supabase
      .from('stock_movements' as any)
      .insert([{ 
        ...params, 
        reference_number: ref,
        status: 'requested' 
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as StockTransfer;
  },

  async updateTransferStatus(transferId: string, status: StockTransfer['status']) {
    const { data, error } = await supabase
      .from('stock_movements' as any)
      .update({ status })
      .eq('id', transferId)
      .select()
      .single();
    
    if (error) throw error;
    return data as unknown as StockTransfer;
  },

  async getTransfers(companyId: string): Promise<StockTransfer[]> {
    const { data, error } = await supabase
      .from('supply_chain_movements' as any)
      .select(`
        *,
        origin:operational_units!origin_id(name),
        destination:operational_units!destination_id(name)
      `)
      .eq('company_id', companyId);

    if (error) throw error;
    return (data || []) as any[];
  },

  async getPosTerminals(unitId: string) {
    const { data, error } = await supabase
      .from('pos_terminals' as any)
      .select('*')
      .eq('unit_id', unitId);
    
    if (error) throw error;
    return data || [];
  }
};