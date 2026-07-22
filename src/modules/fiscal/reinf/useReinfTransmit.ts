import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useReinfTransmit() {
  const [transmitting, setTransmitting] = useState(false);

  const transmit = async (periodId: string | undefined, eventsCount: number) => {
    if (!periodId) {
      toast.error('Abra a competência antes de transmitir.');
      return;
    }
    if (eventsCount === 0) {
      toast.error('Não há eventos para transmitir nesta competência.');
      return;
    }
    setTransmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reinf-transmit', {
        body: { period_id: periodId },
      });
      if (error) throw error;
      if (data?.ok) {
        toast.success(`Transmissão ${data.env === 'simulated' ? 'SIMULADA' : 'enviada'}`, {
          description: `Protocolo ${data.protocol} • ${data.events_count} evento(s)`,
        });
      } else {
        toast.warning('Transmissão bloqueada', {
          description: data?.message || 'Certificado A1 ainda não configurado (Sprint 1.1).',
        });
      }
    } catch (err: any) {
      toast.error('Falha na transmissão', { description: err.message });
    } finally {
      setTransmitting(false);
    }
  };

  return { transmit, transmitting };
}
