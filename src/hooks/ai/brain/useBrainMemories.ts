import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BrainMemory, MemoryRow, SaveMemoryInput } from './types';

export function useBrainMemories() {
  return useQuery({
    queryKey: ['brain_memories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_brain_memory')
        .select('*')
        .order('importance', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return ((data ?? []) as MemoryRow[]) as unknown as BrainMemory[];
    },
  });
}

export function useSaveMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memory: SaveMemoryInput) => {
      const { data, error } = await supabase.functions.invoke('ai-brain', {
        body: { action: 'save_memory', memory },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brain_memories'] }),
  });
}
