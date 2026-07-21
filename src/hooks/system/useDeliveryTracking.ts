import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export function useDeliveryTracking(shipmentId?: string) {
  return useQuery({
    queryKey: ['delivery-tracking', shipmentId],
    queryFn: async () => {
      let query = supabase
        .from('delivery_tracking')
        .select('*')
        .order('occurred_at', { ascending: false });
      if (shipmentId) query = query.eq('shipment_id', shipmentId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: shipmentId ? !!shipmentId : true,
  });
}

export function useCreateTrackingEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      shipment_id: string;
      event_type: string;
      description: string;
      location?: string;
      registered_by?: string;
    }) => {
      const { error } = await supabase.from('delivery_tracking').insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-tracking'] });
      toastSuccess('Evento de rastreamento registrado!');
    },
    onError: handleMutationError,
  });
}
