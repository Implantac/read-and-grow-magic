import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rfidService } from '@/services/system/rfidService';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toastSuccess, toastError } from '@/lib/toastHelpers';
import type { RFIDReader, RFIDTag } from '@/types/rfid';

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

  // Readers Mutations
  const createReaderMutation = useMutation({
    mutationFn: async (reader: Partial<RFIDReader>) => {
      const { data, error } = await supabase.from('rfid_readers' as any).insert({
        code: reader.code, 
        name: reader.name, 
        location: reader.location, 
        zone: reader.zone,
        ip_address: reader.ipAddress, 
        port: reader.port, 
        model: reader.model,
        manufacturer: reader.manufacturer, 
        antenna_count: reader.antennaCount || 1,
        status: reader.status || 'active',
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfid_readers'] });
      toastSuccess('Leitor RFID cadastrado com sucesso');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao cadastrar leitor');
    }
  });

  const deleteReaderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rfid_readers' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfid_readers'] });
      toastSuccess('Leitor RFID excluído');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao excluir leitor');
    }
  });

  // Tags Mutations
  const createTagMutation = useMutation({
    mutationFn: async (tag: Partial<RFIDTag>) => {
      const { data, error } = await supabase.from('rfid_tags' as any).insert({
        epc: tag.epc, 
        tag_type: tag.tagType || 'product', 
        product_id: tag.productId,
        product_code: tag.productCode, 
        product_name: tag.productName,
        batch: tag.batch, 
        pallet_id: tag.palletId, 
        location: tag.location,
        status: tag.status || 'active',
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfid_tags'] });
      toastSuccess('Tag RFID registrada com sucesso');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao registrar tag');
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rfid_tags' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfid_tags'] });
      toastSuccess('Tag RFID excluída');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao excluir tag');
    }
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
    
    // Mutations
    createReader: createReaderMutation.mutateAsync,
    deleteReader: deleteReaderMutation.mutateAsync,
    createTag: createTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
  };
}
