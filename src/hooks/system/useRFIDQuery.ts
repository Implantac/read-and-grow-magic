import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rfidService } from '@/services/system/rfidService';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useRFID() {
  const queryClient = useQueryClient();

  const readersQuery = useQuery({
    queryKey: ['rfid_readers'],
    queryFn: () => rfidService.getReaders(),
  });

  const tagsQuery = useQuery({
    queryKey: ['rfid_tags'],
    queryFn: () => rfidService.getTags(),
  });

  const eventsQuery = (limit = 100) => useQuery({
    queryKey: ['rfid_events', limit],
    queryFn: () => rfidService.getEvents(limit),
  });

  // Realtime subscription for events
  useEffect(() => {
    const channel = supabase
      .channel('rfid-events-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rfid_events' }, () => {
        queryClient.invalidateQueries({ queryKey: ['rfid_events'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    readers: readersQuery.data || [],
    readersLoading: readersQuery.isLoading,
    tags: tagsQuery.data || [],
    tagsLoading: tagsQuery.isLoading,
    getEvents: eventsQuery,
  };
}
