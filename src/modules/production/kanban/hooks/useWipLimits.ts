import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useWipLimits() {
  const [wipLimits, setWipLimits] = useState<Record<string, number>>({});
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from('kanban_limits').select('*');
      if (data) {
        const map: Record<string, number> = {};
        data.forEach((r: any) => { map[r.column_name] = r.wip_limit; });
        setWipLimits(map);
      }
    })();
  }, []);
  return wipLimits;
}
