import { supabase } from '@/integrations/supabase/client';

export class WmsService {
  private readonly supabase = supabase;

  // Inventory
  async getStockBalances(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('stock_balances' as any)
      .select('*')
      .order('product_name');

    if (error) throw error;
    return data || [];
  }

  // Movements
  async getMovements(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('stock_movements' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Storage
  async getStorageLocations(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('storage_locations' as any)
      .select('*')
      .order('code');

    if (error) throw error;
    return data || [];
  }
}

export const wmsService = new WmsService();
