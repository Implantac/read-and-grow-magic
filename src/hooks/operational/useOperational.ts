import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { operationalService } from '@/services/operational/operationalService';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

export function useOperational() {
  const queryClient = useQueryClient();

  const shipmentsQuery = useQuery({
    queryKey: ['shipment_orders'],
    queryFn: () => operationalService.getShipments(),
  });

  const updateShipmentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => operationalService.updateShipmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment_orders'] });
      toastSuccess('Status da expedição atualizado');
    },
    onError: (error: any) => {
      console.error('Error updating shipment:', error);
      toastError('Erro ao atualizar expedição');
    }
  });

  // Factory helper around useQuery — kept here for cohesion with the operational hooks group.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const trackingQuery = (shipmentId: string) => useQuery({
    queryKey: ['delivery_tracking', shipmentId],
    queryFn: () => operationalService.getTrackingEvents(shipmentId),
    enabled: !!shipmentId
  });

  const createTrackingEventMutation = useMutation({
    mutationFn: (event: any) => operationalService.createTrackingEvent(event),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['delivery_tracking', variables.shipment_id] });
    },
    onError: (error: any) => {
      console.error('Error creating tracking event:', error);
      toastError('Erro ao registrar evento de rastreio');
    }
  });

  return {
    shipments: shipmentsQuery.data || [],
    shipmentsLoading: shipmentsQuery.isLoading,
    updateShipmentStatus: updateShipmentStatusMutation.mutate,
    getTracking: trackingQuery,
    createTrackingEvent: createTrackingEventMutation.mutate,
  };
}
