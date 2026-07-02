import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Sprint 12 — Notificações em tempo real de alertas críticos de margem.
 * Assina INSERTs em commercial_alerts (alert_type = 'low_margin') e
 * dispara toast + invalida cache para atualizar o painel automaticamente.
 */
export function useLowMarginAlertsRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('commercial_alerts_low_margin')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'commercial_alerts',
          filter: 'alert_type=eq.low_margin',
        },
        (payload) => {
          const row: any = payload.new;
          const severity = row?.severity ?? 'high';
          const title = row?.title ?? 'Alerta de margem crítica';
          const description = row?.description ?? undefined;

          if (severity === 'critical') {
            toast.error(title, { description, duration: 8000 });
          } else {
            toast.warning(title, { description, duration: 6000 });
          }

          qc.invalidateQueries({ queryKey: ['commercial_alerts'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
