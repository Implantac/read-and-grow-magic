import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toastSuccess, toastError, handleMutationError } from '@/lib/toastHelpers';
import { BaseService } from '@/services/shared/baseService';

export function useCrud<T extends { id: string }>(
  service: BaseService<T>,
  queryKey: string[],
  entityName: string
) {
  const queryClient = useQueryClient();

  const useList = (options = {}) => {
    return useQuery({
      queryKey,
      queryFn: () => service.getAll(options),
    });
  };

  const useDetail = (id: string) => {
    return useQuery({
      queryKey: [...queryKey, id],
      queryFn: () => service.getById(id),
      enabled: !!id,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (item: any) => service.create(item),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        toastSuccess(`${entityName} cadastrado com sucesso!`);
      },
      onError: (error: any) => {
        console.error(`Error creating ${entityName}:`, error);
        handleMutationError(error);
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, ...updates }: { id: string } & any) => service.update(id, updates),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        toastSuccess(`${entityName} atualizado com sucesso!`);
      },
      onError: (error: any) => {
        console.error(`Error updating ${entityName}:`, error);
        handleMutationError(error);
      },
    });
  };

  const useDelete = () => {
    return useMutation({
      mutationFn: (id: string) => service.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        toastSuccess(`${entityName} excluído com sucesso!`);
      },
      onError: (error: any) => {
        console.error(`Error deleting ${entityName}:`, error);
        handleMutationError(error);
      },
    });
  };

  return {
    useList,
    useDetail,
    useCreate,
    useUpdate,
    useDelete,
  };
}
