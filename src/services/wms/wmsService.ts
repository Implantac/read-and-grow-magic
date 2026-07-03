import { supabase } from '@/integrations/supabase/client';

/**
 * WmsService — reads consolidados de estoque, movimentos e endereços.
 * Tabelas: stock_balances, stock_movements, wms_storage_locations.
 */
export class WmsService {
  async getStockBalances() {
    const { data, error } = await supabase
      .from('stock_balances')
      .select('*')
      .order('product_name');
    if (error) throw error;
    return data ?? [];
  }

  async getMovements() {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  }

  async getStorageLocations() {
    const { data, error } = await supabase
      .from('wms_storage_locations')
      .select('*')
      .order('code');
    if (error) throw error;
    return data ?? [];
  }
}

export const wmsService = new WmsService();
