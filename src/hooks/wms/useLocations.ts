import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  status: string;
  type?: string | null;
  manager?: string | null;
  address?: string | null;
}

export interface Zone {
  id: string;
  warehouse_id: string;
  code: string;
  name: string;
  zone_type: string;
  temperature_range?: string | null;
  is_picking_zone?: boolean | null;
  is_bulk_zone?: boolean | null;
  priority?: number | null;
  status: string;
}

export interface Location {
  id: string;
  zone_id: string;
  code: string;
  street?: string | null;
  column_code?: string | null;
  level_code?: string | null;
  position_code?: string | null;
  location_type: string;
  max_weight?: number | null;
  max_volume?: number | null;
  current_weight?: number | null;
  current_volume?: number | null;
  status: string;
  active: boolean;
  abc_classification?: string | null;
}

export function useLocations() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [w, z, l] = await Promise.all([
      supabase.from('warehouses').select('id,code,name,status,type,manager,address').order('code'),
      supabase.from('warehouse_zones').select('id,warehouse_id,code,name,zone_type,temperature_range,is_picking_zone,is_bulk_zone,priority,status').order('code'),
      supabase.from('warehouse_locations').select('id,zone_id,code,street,column_code,level_code,position_code,location_type,max_weight,max_volume,current_weight,current_volume,status,active,abc_classification').order('code'),
    ]);
    if (w.error) toast.error('Erro ao carregar armazéns');
    if (z.error) toast.error('Erro ao carregar zonas');
    if (l.error) toast.error('Erro ao carregar endereços');
    setWarehouses((w.data as Warehouse[]) || []);
    setZones((z.data as Zone[]) || []);
    setLocations((l.data as Location[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getCompanyId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('profiles').select('company_id').eq('id', user.id).maybeSingle();
    return (data?.company_id as string) || null;
  };

  const createWarehouse = async (payload: Partial<Warehouse>) => {
    const company_id = await getCompanyId();
    if (!company_id) return toast.error('Empresa não identificada');
    const { error } = await supabase.from('warehouses').insert({
      company_id,
      code: payload.code!,
      name: payload.name!,
      status: payload.status || 'active',
      type: payload.type || null,
      manager: payload.manager || null,
      address: payload.address || null,
    } as any);
    if (error) return toast.error(error.message);
    toast.success('Armazém criado');
    fetchAll();
  };

  const createZone = async (payload: Partial<Zone>) => {
    const company_id = await getCompanyId();
    if (!company_id) return toast.error('Empresa não identificada');
    if (!payload.warehouse_id) return toast.error('Selecione um armazém');
    const { error } = await supabase.from('warehouse_zones').insert({
      company_id,
      warehouse_id: payload.warehouse_id,
      code: payload.code!,
      name: payload.name!,
      zone_type: payload.zone_type || 'picking',
      status: payload.status || 'active',
      is_picking_zone: payload.is_picking_zone ?? false,
      is_bulk_zone: payload.is_bulk_zone ?? false,
      temperature_range: payload.temperature_range || null,
      priority: payload.priority ?? 1,
    } as any);
    if (error) return toast.error(error.message);
    toast.success('Zona criada');
    fetchAll();
  };

  const createLocation = async (payload: Partial<Location>) => {
    const company_id = await getCompanyId();
    if (!company_id) return toast.error('Empresa não identificada');
    if (!payload.zone_id) return toast.error('Selecione uma zona');
    const { error } = await supabase.from('warehouse_locations').insert({
      company_id,
      zone_id: payload.zone_id,
      code: payload.code!,
      location_type: payload.location_type || 'shelf',
      status: payload.status || 'empty',
      active: payload.active ?? true,
      street: payload.street || null,
      column_code: payload.column_code || null,
      level_code: payload.level_code || null,
      position_code: payload.position_code || null,
      max_weight: payload.max_weight ?? null,
      max_volume: payload.max_volume ?? null,
      abc_classification: payload.abc_classification || null,
    } as any);
    if (error) return toast.error(error.message);
    toast.success('Endereço criado');
    fetchAll();
  };

  const deleteLocation = async (id: string) => {
    const { error } = await supabase.from('warehouse_locations').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Endereço removido');
    fetchAll();
  };

  const deleteZone = async (id: string) => {
    const { error } = await supabase.from('warehouse_zones').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Zona removida');
    fetchAll();
  };

  return { warehouses, zones, locations, loading, refresh: fetchAll, createWarehouse, createZone, createLocation, deleteLocation, deleteZone };
}
