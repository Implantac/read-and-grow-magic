import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/shared/useSupabaseQuery';
import { toastSuccess, handleMutationError } from '@/lib/toastHelpers';
import { BaseService } from '@/services/shared/baseService';
import { Database } from '@/integrations/supabase/types';

type PublicSchema = Database['public'];
type TableName = keyof PublicSchema['Tables'];

/**
 * Utility hook for common CRUD operations using BaseService.
 */
export function useCrud<T extends TableName>(
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
      (item: PublicSchema['Tables'][T]['Insert']) => service.create(item),
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
      ({ id, ...updates }: { id: string } & PublicSchema['Tables'][T]['Update']) => 
        service.update(id, updates as PublicSchema['Tables'][T]['Update']),
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
