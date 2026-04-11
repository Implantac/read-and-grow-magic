import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DistributionCenter {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  manager: string | null;
  totalCapacity: number;
  usedCapacity: number;
  status: string;
  createdAt: string;
}

export function useDistributionCenters() {
  const [centers, setCenters] = useState<DistributionCenter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('distribution_centers')
        .select('*')
        .order('name');
      if (error) throw error;
      setCenters((data || []).map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        address: r.address,
        city: r.city,
        state: r.state,
        manager: r.manager,
        totalCapacity: Number(r.total_capacity_m3),
        usedCapacity: Number(r.used_capacity_m3),
        status: r.status,
        createdAt: r.created_at,
      })));
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar CDs');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = async (dc: Partial<DistributionCenter>) => {
    try {
      const { error } = await supabase.from('distribution_centers').insert({
        code: dc.code || `CD-${Date.now()}`,
        name: dc.name || '',
        address: dc.address,
        city: dc.city,
        state: dc.state,
        manager: dc.manager,
        total_capacity_m3: dc.totalCapacity || 0,
      });
      if (error) throw error;
      toast.success('CD criado');
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar CD');
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);
  return { centers, loading, refetch: fetchData, create };
}
