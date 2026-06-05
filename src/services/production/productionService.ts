import { supabase } from '@/integrations/supabase/client';

export class ProductionService {
  private readonly supabase = supabase;

  // Production Orders
  async getProductionOrders(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('production_orders' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('production_orders' as any)
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  }

  // Production Resources
  async getResources(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('production_resources' as any)
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  }

  // Quality Control
  async getQualityInspections(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('quality_inspections' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
}

export const productionService = new ProductionService();
