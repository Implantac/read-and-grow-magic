import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import type { RFIDReader, RFIDTag, RFIDEvent, RFIDSummary } from '@/types/rfid';

type ReaderRow = Database['public']['Tables']['rfid_readers']['Row'];
type ReaderUpdate = Database['public']['Tables']['rfid_readers']['Update'];
type TagRow = Database['public']['Tables']['rfid_tags']['Row'];
type TagUpdate = Database['public']['Tables']['rfid_tags']['Update'];
type EventRow = Database['public']['Tables']['rfid_events']['Row'];

export function useRFIDReaders() {
  const [readers, setReaders] = useState<RFIDReader[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('rfid_readers').select('*').order('code');
    if (error) { console.error(error); toast.error('Erro ao carregar leitores RFID'); }
    else setReaders((data || []).map((r: ReaderRow): RFIDReader => ({
      id: r.id, code: r.code, name: r.name, location: r.location, zone: r.zone,
      ipAddress: r.ip_address, port: r.port, model: r.model, manufacturer: r.manufacturer,
      antennaCount: r.antenna_count || 1, status: r.status as RFIDReader['status'],
      lastHeartbeat: r.last_heartbeat, createdAt: r.created_at, updatedAt: r.updated_at,
    })));
    setLoading(false);
  }, []);

  const create = async (reader: Partial<RFIDReader>) => {
    const { error } = await supabase.from('rfid_readers').insert({
      code: reader.code, name: reader.name, location: reader.location, zone: reader.zone,
      ip_address: reader.ipAddress, port: reader.port, model: reader.model,
      manufacturer: reader.manufacturer, antenna_count: reader.antennaCount || 1,
      status: reader.status || 'active',
    } as any);
    if (error) { toast.error('Erro ao criar leitor'); return false; }
    toast.success('Leitor RFID cadastrado!');
    await fetch();
    return true;
  };

  const update = async (id: string, updates: Partial<RFIDReader>) => {
    const mapped: ReaderUpdate = {};
    if (updates.code !== undefined) mapped.code = updates.code;
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.location !== undefined) mapped.location = updates.location;
    if (updates.zone !== undefined) mapped.zone = updates.zone;
    if (updates.ipAddress !== undefined) mapped.ip_address = updates.ipAddress;
    if (updates.port !== undefined) mapped.port = updates.port;
    if (updates.model !== undefined) mapped.model = updates.model;
    if (updates.manufacturer !== undefined) mapped.manufacturer = updates.manufacturer;
    if (updates.antennaCount !== undefined) mapped.antenna_count = updates.antennaCount;
    if (updates.status !== undefined) mapped.status = updates.status;
    mapped.updated_at = new Date().toISOString();

    const { error } = await supabase.from('rfid_readers').update(mapped as any).eq('id', id);
    if (error) { toast.error('Erro ao atualizar leitor'); return false; }
    toast.success('Leitor atualizado!');
    await fetch();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('rfid_readers').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir leitor'); return false; }
    toast.success('Leitor excluído!');
    await fetch();
    return true;
  };

  useEffect(() => { fetch(); }, [fetch]);
  return { readers, loading, refetch: fetch, create, update, remove };
}

export function useRFIDTags() {
  const [tags, setTags] = useState<RFIDTag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('rfid_tags').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); toast.error('Erro ao carregar tags RFID'); }
    else setTags((data || []).map((r: TagRow): RFIDTag => ({
      id: r.id, epc: r.epc, tagType: r.tag_type as RFIDTag['tagType'], productId: r.product_id,
      productCode: r.product_code, productName: r.product_name, batch: r.batch,
      palletId: r.pallet_id, location: r.location, status: r.status as RFIDTag['status'],
      registeredAt: r.registered_at, lastReadAt: r.last_read_at,
      createdAt: r.created_at, updatedAt: r.updated_at,
    })));
    setLoading(false);
  }, []);

  const create = async (tag: Partial<RFIDTag>) => {
    const { error } = await supabase.from('rfid_tags').insert({
      epc: tag.epc, tag_type: tag.tagType || 'product', product_id: tag.productId,
      product_code: tag.productCode, product_name: tag.productName,
      batch: tag.batch, pallet_id: tag.palletId, location: tag.location,
      status: tag.status || 'active',
    } as any);
    if (error) { toast.error('Erro ao registrar tag'); return false; }
    toast.success('Tag RFID registrada!');
    await fetch();
    return true;
  };

  const update = async (id: string, updates: TagUpdate) => {
    const { error } = await supabase.from('rfid_tags').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
    if (error) { toast.error('Erro ao atualizar tag'); return false; }
    toast.success('Tag atualizada!');
    await fetch();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('rfid_tags').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir tag'); return false; }
    toast.success('Tag excluída!');
    await fetch();
    return true;
  };

  useEffect(() => { fetch(); }, [fetch]);
  return { tags, loading, refetch: fetch, create, update, remove };
}

export function useRFIDEvents(limit = 100) {
  const [events, setEvents] = useState<RFIDEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('rfid_events')
      .select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) { console.error(error); toast.error('Erro ao carregar eventos RFID'); }
    else setEvents((data || []).map((r: EventRow): RFIDEvent => ({
      id: r.id, readerId: r.reader_id, readerCode: r.reader_code,
      tagEpc: r.tag_epc, tagId: r.tag_id, eventType: r.event_type as RFIDEvent['eventType'],
      rssi: r.rssi ? Number(r.rssi) : undefined, antenna: r.antenna || 1,
      location: r.location, zone: r.zone, processed: r.processed,
      processedAt: r.processed_at, actionTaken: r.action_taken,
      metadata: (r.metadata && typeof r.metadata === 'object' && !Array.isArray(r.metadata))
        ? (r.metadata as Record<string, unknown>) as Record<string, any>
        : undefined,
      createdAt: r.created_at,
    })));
    setLoading(false);
  }, [limit]);

  // Subscribe to realtime events
  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('rfid-events-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rfid_events' }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { events, loading, refetch: fetch };
}

export function useRFIDSummary() {
  const [summary, setSummary] = useState<RFIDSummary>({
    totalReaders: 0, activeReaders: 0, totalTags: 0, activeTags: 0,
    eventsToday: 0, unprocessedEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [readersRes, tagsRes, eventsRes] = await Promise.all([
      supabase.from('rfid_readers').select('status'),
      supabase.from('rfid_tags').select('status'),
      supabase.from('rfid_events').select('processed,created_at').gte('created_at', today.toISOString()),
    ]);

    const readers = readersRes.data || [];
    const tags = tagsRes.data || [];
    const events = eventsRes.data || [];

    setSummary({
      totalReaders: readers.length,
      activeReaders: readers.filter((r) => r.status === 'active').length,
      totalTags: tags.length,
      activeTags: tags.filter((t) => t.status === 'active').length,
      eventsToday: events.length,
      unprocessedEvents: events.filter((e) => !e.processed).length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { summary, loading, refetch: fetch };
}
