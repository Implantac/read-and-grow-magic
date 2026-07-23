import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEnterpriseStore } from '@/core/stores/useEnterpriseStore';

export function useKanbanRealtime(refetch: () => void) {
  const kanbanCompanyId = useEnterpriseStore((s) => s.activeCompanyId);
  useEffect(() => {
    if (!kanbanCompanyId) return;
    const channel = supabase
      .channel(`kanban-realtime:${kanbanCompanyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_orders', filter: `company_id=eq.${kanbanCompanyId}` }, () => { refetch(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch, kanbanCompanyId]);
}
