import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tmsService } from '@/services/operational/tmsService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function useTMS() {
  const queryClient = useQueryClient();

  const carriersQuery = useQuery({
    queryKey: ['tms_carriers'],
    queryFn: () => tmsService.getCarriers(),
  });

  const vehiclesQuery = useQuery({
    queryKey: ['tms_vehicles'],
    queryFn: () => tmsService.getVehicles(),
  });

  const routesQuery = useQuery({
    queryKey: ['tms_routes'],
    queryFn: () => tmsService.getRoutes(),
  });

  const proofsQuery = useQuery({
    queryKey: ['tms_proofs'],
    queryFn: () => tmsService.getProofs(),
  });

  const createCarrierMutation = useMutation({
    mutationFn: (carrier: any) => tmsService.createCarrier(carrier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tms_carriers'] });
      toastSuccess('Transportadora criada com sucesso');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao criar transportadora');
    }
  });

  const updateCarrierMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => tmsService.updateCarrier(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tms_carriers'] });
      toastSuccess('Transportadora atualizada');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao atualizar transportadora');
    }
  });

  const deleteCarrierMutation = useMutation({
    mutationFn: (id: string) => tmsService.deleteCarrier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tms_carriers'] });
      toastSuccess('Transportadora excluída');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao excluir transportadora');
    }
  });

  return {
    carriers: carriersQuery.data || [],
    carriersLoading: carriersQuery.isLoading,
    vehicles: vehiclesQuery.data || [],
    vehiclesLoading: vehiclesQuery.isLoading,
    routes: routesQuery.data || [],
    routesLoading: routesQuery.isLoading,
    proofs: proofsQuery.data || [],
    proofsLoading: proofsQuery.isLoading,
    
    // Carriers Mutations
    createCarrier: createCarrierMutation.mutateAsync,
    updateCarrier: updateCarrierMutation.mutateAsync,
    deleteCarrier: deleteCarrierMutation.mutateAsync,
  };
}
