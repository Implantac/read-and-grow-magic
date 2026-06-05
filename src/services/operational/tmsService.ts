import { supabase } from '@/integrations/supabase/client';

export const tmsService = {
  // Carriers
  async getCarriers() {
    const { data, error } = await supabase.from('carriers' as any).select('*').order('name');
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id, 
      code: r.code, 
      name: r.name, 
      document: r.document || '',
      contactName: r.contact_name || '', 
      phone: r.phone || '', 
      email: r.email || '',
      address: r.address || '', 
      serviceTypes: r.service_types || [], 
      active: r.active,
      notes: r.notes || '', 
      createdAt: r.created_at,
    }));
  },

  async createCarrier(carrier: any) {
    const { data, error } = await supabase.from('carriers' as any).insert(carrier).select().single();
    if (error) throw error;
    return data;
  },

  async updateCarrier(id: string, updates: any) {
    const { data, error } = await supabase.from('carriers' as any).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteCarrier(id: string) {
    const { error } = await supabase.from('carriers' as any).delete().eq('id', id);
    if (error) throw error;
  },

  // Vehicles
  async getVehicles() {
    const { data, error } = await supabase.from('vehicles' as any).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id, 
      carrierId: r.carrier_id, 
      plate: r.plate, 
      model: r.model || '',
      vehicleType: r.vehicle_type || 'truck', 
      maxWeight: Number(r.max_weight),
      maxVolume: Number(r.max_volume), 
      driverName: r.driver_name || '',
      driverPhone: r.driver_phone || '', 
      status: r.status, 
      createdAt: r.created_at,
    }));
  },

  async createVehicle(vehicle: any) {
    const { data, error } = await supabase.from('vehicles' as any).insert(vehicle).select().single();
    if (error) throw error;
    return data;
  },

  async updateVehicle(id: string, updates: any) {
    const { data, error } = await supabase.from('vehicles' as any).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // Routes
  async getRoutes() {
    const { data, error } = await supabase.from('delivery_routes' as any).select('*').order('planned_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id, 
      routeNumber: r.route_number, 
      carrierId: r.carrier_id || '',
      vehicleId: r.vehicle_id || '', 
      driverName: r.driver_name || '',
      plannedDate: r.planned_date, 
      departureTime: r.departure_time || '',
      arrivalTime: r.arrival_time || '', 
      totalStops: r.total_stops,
      completedStops: r.completed_stops, 
      totalWeight: Number(r.total_weight),
      totalVolume: Number(r.total_volume), 
      status: r.status, 
      notes: r.notes || '',
      createdAt: r.created_at,
    }));
  },

  async createRoute(route: any) {
    const { data, error } = await supabase.from('delivery_routes' as any).insert(route).select().single();
    if (error) throw error;
    return data;
  },

  async updateRoute(id: string, updates: any) {
    const { data, error } = await supabase.from('delivery_routes' as any).update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // Proofs
  async getProofs() {
    const { data, error } = await supabase.from('delivery_proof' as any).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: r.id, 
      routeId: r.route_id || '', 
      orderNumber: r.order_number || '',
      customerName: r.customer_name || '', 
      deliveredAt: r.delivered_at || '',
      receivedBy: r.received_by || '', 
      signatureUrl: r.signature_url || '',
      photoUrl: r.photo_url || '', 
      latitude: Number(r.latitude || 0),
      longitude: Number(r.longitude || 0), 
      status: r.status,
      refusalReason: r.refusal_reason || '', 
      notes: r.notes || '',
      createdAt: r.created_at,
    }));
  }
};
