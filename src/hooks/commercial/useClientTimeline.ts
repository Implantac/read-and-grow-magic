import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

import { handleMutationError, toastSuccess } from '@/lib/toastHelpers';
export const TIMELINE_EVENT_TYPES = [
  { value: 'contact', label: 'Contato', icon: 'Phone' },
  { value: 'visit', label: 'Visita', icon: 'MapPin' },
  { value: 'negotiation', label: 'Negociação', icon: 'Handshake' },
  { value: 'proposal', label: 'Proposta', icon: 'FileText' },
  { value: 'order', label: 'Pedido', icon: 'ShoppingCart' },
  { value: 'return', label: 'Devolução', icon: 'RotateCcw' },
  { value: 'issue', label: 'Ocorrência', icon: 'AlertTriangle' },
  { value: 'note', label: 'Anotação', icon: 'StickyNote' },
  { value: 'followup', label: 'Follow-up', icon: 'Clock' },
];

export interface DbTimelineEvent {
  id: string;
  client_id: string;
  user_id: string | null;
  user_name: string | null;
  event_type: string;
  title: string;
  description: string | null;
  metadata: any;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export function useClientTimeline(clientId: string | undefined) {
  return useQuery({
    queryKey: ['client_timeline', clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_timeline')
        .select('*')
        .eq('client_id', clientId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbTimelineEvent[];
    },
  });
}

export function useCreateTimelineEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: TablesInsert<'client_timeline'>) => {
      const { data, error } = await supabase.from('client_timeline').insert(event).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['client_timeline'] });
      toastSuccess('Evento registrado');
    },
    onError: handleMutationError,
  });
}
