import { supabase } from '@/integrations/supabase/client';
import { InventoryItem, InventoryCount } from '@/types/wms';

export class InventoryService {
  async getInventoryItems() {
    const { data, error } = await supabase
      .from('wms_inventory_items')
      .select('*')
      .order('product_name');
    
    if (error) throw error;
    
    return (data || []).map((row) => ({
      id: row.id,
      productCode: row.product_code,
      productName: row.product_name,
      category: row.category || '',
      location: row.location || '',
      quantity: Number(row.quantity),
      reservedQty: Number(row.reserved_qty),
      availableQty: Number(row.available_qty),
      minStock: Number(row.min_stock),
      maxStock: Number(row.max_stock),
      unit: row.unit,
      batch: row.batch || undefined,
      expirationDate: row.expiration_date || undefined,
      status: row.status as InventoryItem['status'],
      lastMovement: row.last_movement || '',
      value: Number(row.value),
    })) as InventoryItem[];
  }

  async getInventoryCounts() {
    const { data, error } = await supabase
      .from('wms_inventory_counts')
      .select('*')
      .order('scheduled_date', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      countNumber: row.count_number,
      zone: row.zone || undefined,
      status: row.status as InventoryCount['status'],
      scheduledDate: row.scheduled_date,
      startedAt: row.started_at || undefined,
      completedAt: row.completed_at || undefined,
      itemsCount: row.items_count,
      discrepancies: row.discrepancies,
      operator: row.operator || undefined,
    })) as InventoryCount[];
  }
}

export const inventoryService = new InventoryService();
