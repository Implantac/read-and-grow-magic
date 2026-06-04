import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/shared/useSupabaseQuery';
import { toastSuccess, handleMutationError } from '@/lib/toastHelpers';
import { BaseService } from '@/services/shared/baseService';

/**
 * Hook utilitário para operações CRUD comuns usando BaseService.
 */
export function useCrud<T extends { id: string }>(
  service: BaseService<T>,
  queryKey: string[],
  entityName: string
) {
  const queryClient = useQueryClient();

  const useList = (options = {}) => {
    return useSupabaseQuery(queryKey, () => service.getAll(options));
  };

  const useDetail = (id: string) => {
    return useSupabaseQuery([...queryKey, id], () => service.getById(id), {
      enabled: !!id,
    });
  };

  const useCreate = () => {
    return useSupabaseMutation(
      (item: Omit<T, 'id' | 'created_at' | 'updated_at'>) => service.create(item),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey });
          toastSuccess(`${entityName} cadastrado com sucesso!`);
        },
        onError: (error: any) => handleMutationError(error),
      }
    );
  };

  const useUpdate = () => {
    return useSupabaseMutation(
      ({ id, ...updates }: { id: string } & Partial<T>) => service.update(id, updates as Partial<T>),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey });
          toastSuccess(`${entityName} atualizado com sucesso!`);
        },
        onError: (error: any) => handleMutationError(error),
      }
    );
  };

  const useDelete = () => {
    return useSupabaseMutation(
      (id: string) => service.delete(id),
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey });
          toastSuccess(`${entityName} excluído com sucesso!`);
        },
        onError: (error: any) => handleMutationError(error),
      }
    );
  };

  return {
    useList,
    useDetail,
    useCreate,
    useUpdate,
    useDelete,
  };
}

