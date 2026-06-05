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
      return await queryFn();
    },
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
