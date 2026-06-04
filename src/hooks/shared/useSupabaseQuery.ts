import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Hook genérico para buscar dados do Supabase via React Query.
 */
export function useSupabaseQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options?: Omit<UseQueryOptions<T | null, PostgrestError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await queryFn();
      if (error) throw error;
      return data;
    },
    ...options,
  });
}

/**
 * Hook genérico para mutações no Supabase.
 */
export function useSupabaseMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<{ data: TData | null; error: PostgrestError | null }>,
  options?: Omit<UseMutationOptions<TData | null, PostgrestError, TVariables>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const { data, error } = await mutationFn(variables);
      if (error) throw error;
      return data;
    },
    ...options,
  });
}
