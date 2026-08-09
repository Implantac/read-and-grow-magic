import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type ShipmentOrder = Tables<'shipment_orders'>;
export type DeliveryTrackingEvent = Tables<'delivery_tracking'>;
export type DeliveryTrackingEventInput = TablesInsert<'delivery_tracking'>;
export type BillingQueueItem = Tables<'billing_queue'>;

export class OperationalService {
  private readonly supabase = supabase;

  // Shipment Orders
  async getShipments(): Promise<ShipmentOrder[]> {
    const { data, error } = await this.supabase
      .from('shipment_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return data || [];
  }

  async updateShipmentStatus(id: string, status: string): Promise<void> {
    const { error } = await this.supabase
      .from('shipment_orders')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  }

  // Delivery Tracking
  async getTrackingEvents(shipmentId: string): Promise<DeliveryTrackingEvent[]> {
    const { data, error } = await this.supabase
      .from('delivery_tracking')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('occurred_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    return data || [];
  }

  async createTrackingEvent(event: DeliveryTrackingEventInput): Promise<void> {
    const { error } = await this.supabase
      .from('delivery_tracking')
      .insert(event);
    if (error) throw error;
  }

  // Operational Queues
  async getBillingQueue(): Promise<BillingQueueItem[]> {
    const { data, error } = await this.supabase
      .from('billing_queue')
      .select('*')
      .limit(200);
    if (error) throw error;
    return data || [];
  }
}

export const operationalService = new OperationalService();
