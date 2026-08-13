/**
 * Abstração de integração Supabase + React Query.
 * Padroniza o tratamento de erros e tipagem das requisições.
 */
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Hook genérico para buscar dados do Supabase via React Query.
 */
export function useSupabaseQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, PostgrestError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (err) {
        console.error(`[useSupabaseQuery] Error fetching ${JSON.stringify(queryKey)}:`, err);
        throw err;
      }
    },
    staleTime: 60000, // Increased to 60s
    gcTime: 5 * 60000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Prevent refetching on every mount if data is not stale
    ...options,
  });
}

/**
 * Hook genérico para mutações no Supabase.
 */
export function useSupabaseMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, PostgrestError, TVariables>, 'mutationFn'>
) {
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      return await mutationFn(variables);
    },
    ...options,
  });
}
