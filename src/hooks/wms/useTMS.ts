import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type CarrierRow = Database['public']['Tables']['carriers']['Row'];
type CarrierInsert = Database['public']['Tables']['carriers']['Insert'];
type CarrierUpdate = Database['public']['Tables']['carriers']['Update'];
type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];
type RouteRow = Database['public']['Tables']['delivery_routes']['Row'];
type RouteInsert = Database['public']['Tables']['delivery_routes']['Insert'];
type RouteUpdate = Database['public']['Tables']['delivery_routes']['Update'];
type ProofRow = Database['public']['Tables']['delivery_proof']['Row'];

export interface Carrier {
  id: string;
  code: string;
  name: string;
  document: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  serviceTypes: string[];
  active: boolean;
  notes: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  carrierId: string;
  plate: string;
  model: string;
  vehicleType: string;
  maxWeight: number;
  maxVolume: number;
  driverName: string;
  driverPhone: string;
  status: string;
  createdAt: string;
}

export interface DeliveryRoute {
  id: string;
  routeNumber: string;
  carrierId: string;
  vehicleId: string;
  driverName: string;
  plannedDate: string;
  departureTime: string;
  arrivalTime: string;
  totalStops: number;
  completedStops: number;
  totalWeight: number;
  totalVolume: number;
  status: string;
  notes: string;
  createdAt: string;
}

export interface DeliveryProofItem {
  id: string;
  routeId: string;
  orderNumber: string;
  customerName: string;
  deliveredAt: string;
  receivedBy: string;
  signatureUrl: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  status: string;
  refusalReason: string;
  notes: string;
  createdAt: string;
}

// ---- CARRIERS ----
export function useCarriers() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('carriers').select('*').order('name');
    if (error) { toast.error('Erro ao carregar transportadoras'); console.error(error); }
    else setCarriers((data || []).map((r: CarrierRow) => ({
      id: r.id, code: r.code, name: r.name, document: r.document || '',
      contactName: r.contact_name || '', phone: r.phone || '', email: r.email || '',
      address: r.address || '', serviceTypes: r.service_types || [], active: r.active,
      notes: r.notes || '', createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  const create = async (carrier: CarrierInsert) => {
    const { error } = await supabase.from('carriers').insert(carrier);
    if (error) { toast.error('Erro ao criar transportadora'); return false; }
    toast.success('Transportadora criada!');
    await fetch();
    return true;
  };

  const update = async (id: string, updates: CarrierUpdate) => {
    const { error } = await supabase.from('carriers').update(updates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return false; }
    toast.success('Transportadora atualizada!');
    await fetch();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('carriers').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return false; }
    toast.success('Transportadora excluída!');
    await fetch();
    return true;
  };

  useEffect(() => { fetch(); }, [fetch]);
  return { carriers, loading, refetch: fetch, create, update, remove };
}

// ---- VEHICLES ----
export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Erro ao carregar veículos'); console.error(error); }
    else setVehicles((data || []).map((r: VehicleRow) => ({
      id: r.id, carrierId: r.carrier_id, plate: r.plate, model: r.model || '',
      vehicleType: r.vehicle_type || 'truck', maxWeight: Number(r.max_weight),
      maxVolume: Number(r.max_volume), driverName: r.driver_name || '',
      driverPhone: r.driver_phone || '', status: r.status, createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  const create = async (vehicle: VehicleInsert) => {
    const { error } = await supabase.from('vehicles').insert(vehicle);
    if (error) { toast.error('Erro ao criar veículo'); return false; }
    toast.success('Veículo criado!');
    await fetch();
    return true;
  };

  const update = async (id: string, updates: VehicleUpdate) => {
    const { error } = await supabase.from('vehicles').update(updates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return false; }
    toast.success('Veículo atualizado!');
    await fetch();
    return true;
  };

  useEffect(() => { fetch(); }, [fetch]);
  return { vehicles, loading, refetch: fetch, create, update };
}

// ---- DELIVERY ROUTES ----
export function useDeliveryRoutes() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('delivery_routes').select('*').order('planned_date', { ascending: false });
    if (error) { toast.error('Erro ao carregar rotas'); console.error(error); }
    else setRoutes((data || []).map((r: RouteRow) => ({
      id: r.id, routeNumber: r.route_number, carrierId: r.carrier_id || '',
      vehicleId: r.vehicle_id || '', driverName: r.driver_name || '',
      plannedDate: r.planned_date, departureTime: r.departure_time || '',
      arrivalTime: r.arrival_time || '', totalStops: r.total_stops,
      completedStops: r.completed_stops, totalWeight: Number(r.total_weight),
      totalVolume: Number(r.total_volume), status: r.status, notes: r.notes || '',
      createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  const create = async (route: RouteInsert) => {
    const { error } = await supabase.from('delivery_routes').insert(route);
    if (error) { toast.error('Erro ao criar rota'); return false; }
    toast.success('Rota criada!');
    await fetch();
    return true;
  };

  const update = async (id: string, updates: RouteUpdate) => {
    const { error } = await supabase.from('delivery_routes').update(updates).eq('id', id);
    if (error) { toast.error('Erro ao atualizar rota'); return false; }
    toast.success('Rota atualizada!');
    await fetch();
    return true;
  };

  useEffect(() => { fetch(); }, [fetch]);
  return { routes, loading, refetch: fetch, create, update };
}

// ---- DELIVERY PROOF ----
export function useDeliveryProof() {
  const [proofs, setProofs] = useState<DeliveryProofItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('delivery_proof').select('*').order('created_at', { ascending: false });
    if (error) { toast.error('Erro ao carregar provas de entrega'); console.error(error); }
    else setProofs((data || []).map((r: ProofRow) => ({
      id: r.id, routeId: r.route_id || '', orderNumber: r.order_number || '',
      customerName: r.customer_name || '', deliveredAt: r.delivered_at || '',
      receivedBy: r.received_by || '', signatureUrl: r.signature_url || '',
      photoUrl: r.photo_url || '', latitude: Number(r.latitude || 0),
      longitude: Number(r.longitude || 0), status: r.status,
      refusalReason: r.refusal_reason || '', notes: r.notes || '',
      createdAt: r.created_at,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { proofs, loading, refetch: fetch };
}

// ---- TMS DASHBOARD STATS ----
export function useTMSDashboardStats() {
  const [stats, setStats] = useState({
    totalCarriers: 0, activeCarriers: 0, totalVehicles: 0,
    availableVehicles: 0, plannedRoutes: 0, inTransitRoutes: 0,
    completedRoutes: 0, pendingDeliveries: 0, deliveredCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [cRes, vRes, rRes, dRes] = await Promise.all([
      supabase.from('carriers').select('active'),
      supabase.from('vehicles').select('status'),
      supabase.from('delivery_routes').select('status'),
      supabase.from('delivery_proof').select('status'),
    ]);

    const carriers = cRes.data || [];
    const vehicles = vRes.data || [];
    const routes = rRes.data || [];
    const deliveries = dRes.data || [];

    setStats({
      totalCarriers: carriers.length,
      activeCarriers: carriers.filter((c) => c.active).length,
      totalVehicles: vehicles.length,
      availableVehicles: vehicles.filter((v) => v.status === 'available').length,
      plannedRoutes: routes.filter((r) => r.status === 'planned').length,
      inTransitRoutes: routes.filter((r) => r.status === 'in_transit').length,
      completedRoutes: routes.filter((r) => r.status === 'completed').length,
      pendingDeliveries: deliveries.filter((d) => d.status === 'pending').length,
      deliveredCount: deliveries.filter((d) => d.status === 'delivered').length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { stats, loading, refetch: fetch };
}
