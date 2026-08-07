import { supabase } from '@/integrations/supabase/client';

export class LastMileService {
  async getShipmentTracking(shipmentId: string) {
    const { data, error } = await (supabase as any)
      .from('wms_shipment_events')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async addTrackingEvent(event: {
    shipment_id: string;
    status: string;
    location_lat?: number;
    location_lng?: number;
    description?: string;
    metadata?: any;
  }) {
    const { data, error } = await (supabase as any)
      .from('wms_shipment_events')
      .insert(event)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async createManifest(shipmentIds: string[], vehicleId: string, driverId: string) {
    const { data: manifest, error: manifestError } = await (supabase as any)
      .from('tms_manifests')
      .insert({
        vehicle_id: vehicleId,
        driver_id: driverId,
        status: 'draft'
      })
      .select()
      .single();
    
    if (manifestError) throw manifestError;

    const manifestItems = shipmentIds.map(id => ({
      manifest_id: (manifest as any).id,
      shipment_id: id
    }));

    const { error: itemsError } = await (supabase as any)
      .from('tms_manifest_items')
      .insert(manifestItems);
    
    if (itemsError) throw itemsError;

    return manifest;
  }
}

export const lastMileService = new LastMileService();
