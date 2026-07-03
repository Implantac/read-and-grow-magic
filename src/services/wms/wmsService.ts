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
    return (data ?? []).map((r) => ({
      id: r.id,
      productId: r.product_id,
      productCode: r.product_code,
      productName: r.product_name,
      lotId: r.lot_id,
      lotNumber: r.lot_number,
      warehouseId: r.warehouse_id,
      dcId: r.dc_id,
      locationId: r.location_id,
      locationCode: r.location_code,
      quantity: Number(r.quantity) || 0,
      reservedQty: Number(r.reserved_qty) || 0,
      availableQty: Number(r.available_qty) || 0,
      stockStatus: r.stock_status,
      lastMovementAt: r.last_movement_at,
      createdAt: r.created_at,
    }));
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
