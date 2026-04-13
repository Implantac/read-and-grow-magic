import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TelemetryReading {
  id: string;
  device_id: string;
  device_type: string;
  machine_id: string | null;
  metric_name: string;
  metric_value: number;
  unit: string | null;
  metadata: any;
  created_at: string;
}

export function useIoTTelemetry(machineId?: string, limit = 100) {
  const [readings, setReadings] = useState<TelemetryReading[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReadings = useCallback(async () => {
    setLoading(true);
    let query = (supabase as any)
      .from('iot_telemetry')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (machineId) query = query.eq('machine_id', machineId);
    const { data, error } = await query;
    if (error) console.error(error);
    else setReadings(data || []);
    setLoading(false);
  }, [machineId, limit]);

  useEffect(() => { fetchReadings(); }, [fetchReadings]);

  // Realtime for telemetry
  useEffect(() => {
    const filter = machineId ? `machine_id=eq.${machineId}` : undefined;
    const channel = supabase
      .channel('iot-telemetry-rt')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'iot_telemetry',
        ...(filter ? { filter } : {}),
      }, (payload) => {
        setReadings(prev => [payload.new as TelemetryReading, ...prev].slice(0, limit));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [machineId, limit]);

  const ingestData = useCallback(async (deviceId: string, deviceType: string, machId: string | null, readings: { metric: string; value: number; unit?: string }[]) => {
    const { data, error } = await supabase.functions.invoke('production-events', {
      body: { action: 'iot_ingest', device_id: deviceId, device_type: deviceType, machine_id: machId, readings },
    });
    if (error) console.error(error);
    return data;
  }, []);

  return { readings, loading, refetch: fetchReadings, ingestData };
}
