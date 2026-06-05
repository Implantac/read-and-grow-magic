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

  // Carriers
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

  // Vehicles
  const createVehicleMutation = useMutation({
    mutationFn: (vehicle: any) => tmsService.createVehicle(vehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tms_vehicles'] });
      toastSuccess('Veículo criado com sucesso');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao criar veículo');
    }
  });

  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => tmsService.updateVehicle(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tms_vehicles'] });
      toastSuccess('Veículo atualizado');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao atualizar veículo');
    }
  });

  // Routes
  const createRouteMutation = useMutation({
    mutationFn: (route: any) => tmsService.createRoute(route),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tms_routes'] });
      toastSuccess('Rota criada com sucesso');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao criar rota');
    }
  });

  const updateRouteMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => tmsService.updateRoute(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tms_routes'] });
      toastSuccess('Rota atualizada');
    },
    onError: (error: any) => {
      toastError(error.message || 'Erro ao atualizar rota');
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
    
    // Mutations
    createCarrier: createCarrierMutation.mutateAsync,
    updateCarrier: updateCarrierMutation.mutateAsync,
    deleteCarrier: deleteCarrierMutation.mutateAsync,
    createVehicle: createVehicleMutation.mutateAsync,
    updateVehicle: updateVehicleMutation.mutateAsync,
    createRoute: createRouteMutation.mutateAsync,
    updateRoute: updateRouteMutation.mutateAsync,
  };
}
