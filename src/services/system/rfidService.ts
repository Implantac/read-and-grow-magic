import { supabase } from '@/integrations/supabase/client';

export const rfidService = {
  async getReaders() {
    const { data, error } = await supabase.from('rfid_readers' as any).select('*').order('code');
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id, 
      code: r.code, 
      name: r.name, 
      location: r.location, 
      zone: r.zone,
      ipAddress: r.ip_address, 
      port: r.port, 
      model: r.model, 
      manufacturer: r.manufacturer,
      antennaCount: r.antenna_count || 1, 
      status: r.status,
      lastHeartbeat: r.last_heartbeat, 
      createdAt: r.created_at, 
      updatedAt: r.updated_at,
    }));
  },

  async getTags() {
    const { data, error } = await supabase.from('rfid_tags' as any).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id, 
      epc: r.epc, 
      tagType: r.tag_type, 
      productId: r.product_id,
      productCode: r.product_code, 
      productName: r.product_name, 
      batch: r.batch,
      palletId: r.pallet_id, 
      location: r.location, 
      status: r.status,
      registeredAt: r.registered_at, 
      lastReadAt: r.last_read_at,
      createdAt: r.created_at, 
      updatedAt: r.updated_at,
    }));
  },

  async getEvents(limit = 100) {
    const { data, error } = await supabase.from('rfid_events' as any)
      .select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id, 
      readerId: r.reader_id, 
      readerCode: r.reader_code,
      tagEpc: r.tag_epc, 
      tagId: r.tag_id, 
      eventType: r.event_type,
      rssi: r.rssi ? Number(r.rssi) : undefined, 
      antenna: r.antenna || 1,
      location: r.location, 
      zone: r.zone, 
      processed: r.processed,
      processedAt: r.processed_at, 
      actionTaken: r.action_taken,
      metadata: r.metadata, 
      createdAt: r.created_at,
    }));
  }
};
