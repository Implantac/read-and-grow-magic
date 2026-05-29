import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { handleMutationError, mutationErrorHandler, toastSuccess } from '@/lib/toastHelpers';
// Order Status History
export function useOrderStatusHistory(orderId?: string) {
  return useQuery({
    queryKey: ['order-status-history', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

// Stock Reservations
export function useStockReservations(orderId?: string) {
  return useQuery({
    queryKey: ['stock-reservations', orderId],
    queryFn: async () => {
      let query = supabase.from('stock_reservations').select('*').order('created_at', { ascending: false });
      if (orderId) query = query.eq('order_id', orderId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: orderId ? !!orderId : true,
  });
}

export function useCreateStockReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      order_id: string;
      order_item_id?: string;
      product_id?: string;
      product_code: string;
      product_name: string;
      requested_qty: number;
      location?: string;
    }) => {
      const { error } = await supabase.from('stock_reservations').insert({
        ...input,
        status: 'reserved',
        reserved_qty: input.requested_qty,
        reserved_at: new Date().toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-reservations'] });
      toastSuccess('Reserva criada com sucesso!');
    },
    onError: mutationErrorHandler('Erro ao criar reserva'),
  });
}

// Conference Records
export function useConferenceRecords(orderId?: string) {
  return useQuery({
    queryKey: ['conference-records', orderId],
    queryFn: async () => {
      let query = supabase.from('conference_records').select('*').order('created_at', { ascending: false });
      if (orderId) query = query.eq('order_id', orderId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateConference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { order_id: string; conference_number: string; total_items: number }) => {
      const { error } = await supabase.from('conference_records').insert(input as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conference-records'] });
      toastSuccess('Conferência criada!');
    },
    onError: handleMutationError,
  });
}

// Billing Queue
export function useBillingQueue() {
  return useQuery({
    queryKey: ['billing-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_queue')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBillingEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { order_id: string; amount: number; billing_type?: string }) => {
      const { error } = await supabase.from('billing_queue').insert({
        ...input,
        pending_amount: input.amount,
        status: 'awaiting_billing',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing-queue'] });
      toastSuccess('Pedido adicionado à fila de faturamento!');
    },
    onError: handleMutationError,
  });
}

export function useUpdateBillingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, ...rest }: { id: string; status: string; [key: string]: any }) => {
      const { error } = await supabase.from('billing_queue').update({ status, ...rest, updated_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing-queue'] });
      toastSuccess('Status de faturamento atualizado!');
    },
    onError: handleMutationError,
  });
}

// Shipment Orders
export function useShipmentOrders(orderId?: string) {
  return useQuery({
    queryKey: ['shipment-orders', orderId],
    queryFn: async () => {
      let query = supabase.from('shipment_orders').select('*').order('created_at', { ascending: false });
      if (orderId) query = query.eq('order_id', orderId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      order_id: string;
      shipment_number: string;
      carrier?: string;
      volumes?: number;
      total_weight?: number;
      total_value?: number;
      freight_cost?: number;
      freight_type?: string;
      expected_delivery?: string;
    }) => {
      const { error } = await supabase.from('shipment_orders').insert(input as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipment-orders'] });
      toastSuccess('Expedição criada!');
    },
    onError: handleMutationError,
  });
}

export function useUpdateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from('shipment_orders').update({ ...fields, updated_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipment-orders'] });
      toastSuccess('Expedição atualizada!');
    },
    onError: handleMutationError,
  });
}

// Enhanced order status update with history
export function useAdvancedOrderStatusUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id, status, observation, block_reason, changed_by, fulfillment_fields
    }: {
      id: string;
      status: string;
      observation?: string;
      block_reason?: string;
      changed_by?: string;
      fulfillment_fields?: Record<string, string>;
    }) => {
      const updatePayload: any = { status, updated_at: new Date().toISOString() };
      if (fulfillment_fields) Object.assign(updatePayload, fulfillment_fields);
      
      const { error } = await supabase.from('orders').update(updatePayload).eq('id', id);
      if (error) throw error;

      // History is auto-recorded by the trigger, but we add observation if provided
      if (observation || block_reason) {
        await supabase.from('order_status_history').update({
          observation, block_reason, changed_by,
        } as any).eq('order_id', id).order('created_at', { ascending: false }).limit(1);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order-status-history'] });
      toastSuccess('Status do pedido atualizado!');
    },
    onError: handleMutationError,
  });
}

// Order flow status configs
export const orderFlowStatuses = [
  { value: 'quote', label: 'Orçamento', color: 'bg-muted text-muted-foreground' },
  { value: 'pending', label: 'Digitado', color: 'bg-muted text-muted-foreground' },
  { value: 'awaiting_commercial_approval', label: 'Aguard. Aprov. Comercial', color: 'bg-warning/10 text-warning' },
  { value: 'awaiting_financial_approval', label: 'Aguard. Aprov. Financeira', color: 'bg-warning/10 text-warning' },
  { value: 'blocked', label: 'Bloqueado', color: 'bg-destructive/10 text-destructive' },
  { value: 'confirmed', label: 'Liberado', color: 'bg-info/10 text-info' },
  { value: 'awaiting_separation', label: 'Aguard. Separação', color: 'bg-accent text-accent-foreground' },
  { value: 'in_separation', label: 'Em Separação', color: 'bg-info/10 text-info' },
  { value: 'awaiting_production', label: 'Aguard. Produção', color: 'bg-warning/10 text-warning' },
  { value: 'in_production', label: 'Em Produção', color: 'bg-info/10 text-info' },
  { value: 'partial_production', label: 'Produção Parcial', color: 'bg-warning/10 text-warning' },
  { value: 'awaiting_conference', label: 'Aguard. Conferência', color: 'bg-accent text-accent-foreground' },
  { value: 'conferenced', label: 'Conferido', color: 'bg-success/10 text-success' },
  { value: 'awaiting_billing', label: 'Aguard. Faturamento', color: 'bg-accent text-accent-foreground' },
  { value: 'invoiced', label: 'Faturado', color: 'bg-primary/10 text-primary' },
  { value: 'shipped', label: 'Expedido', color: 'bg-info/10 text-info' },
  { value: 'delivered', label: 'Entregue', color: 'bg-success/10 text-success' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-destructive/10 text-destructive' },
] as const;

export function getOrderFlowStatus(status: string) {
  return orderFlowStatuses.find(s => s.value === status) || { value: status, label: status, color: 'bg-muted text-muted-foreground' };
}
