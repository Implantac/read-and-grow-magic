import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useWipLimits() {
  const [wipLimits, setWipLimits] = useState<Record<string, number>>({});
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('kanban_limits').select('column_name, wip_limit');
      if (data) {
        const map: Record<string, number> = {};
        data.forEach((r) => { map[r.column_name] = r.wip_limit; });
        setWipLimits(map);
      }
    })();
  }, []);
  return wipLimits;
}
