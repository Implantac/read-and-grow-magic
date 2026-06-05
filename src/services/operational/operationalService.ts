import { supabase } from '@/integrations/supabase/client';

export class OperationalService {
  private readonly supabase = supabase;

  // Shipment Orders
  async getShipments(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('shipment_orders' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateShipmentStatus(id: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('shipment_orders' as any)
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  }

  // Delivery Tracking
  async getTrackingEvents(shipmentId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('delivery_tracking_events' as any)
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('occurred_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createTrackingEvent(event: any): Promise<void> {
    const { error } = await this.supabase
      .from('delivery_tracking_events' as any)
      .insert(event);
    if (error) throw error;
  }

  // Operational Queues
  async getBillingQueue(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('billing_queue' as any)
      .select('*');
    if (error) throw error;
    return data || [];
  }
}

export const operationalService = new OperationalService();
