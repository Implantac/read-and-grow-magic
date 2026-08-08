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
}

export const networkService = {
  async getOperationalUnits(companyId: string) {
    const { data, error } = await supabase
      .from('operational_units' as any)
      .select('*')
      .eq('company_id', companyId);
    
    if (error) throw error;
    return data as OperationalUnit[];
  },

  async createTransfer(params: Omit<StockTransfer, 'id' | 'created_at' | 'reference_number'>) {
    const ref = `TRF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const { data, error } = await supabase
      .from('stock_transfers' as any)
      .insert([{ ...params, reference_number: ref }])
      .select()
      .single();
    
    if (error) throw error;
    return data as StockTransfer;
  },

  async updateTransferStatus(transferId: string, status: StockTransfer['status']) {
    const { data, error } = await supabase
      .from('stock_transfers' as any)
      .update({ status })
      .eq('id', transferId)
      .select()
      .single();
    
    if (error) throw error;
    return data as StockTransfer;
  }
};
