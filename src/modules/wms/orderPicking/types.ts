export type ShipmentStage = 'conferred' | 'labeled' | 'collected' | 'shipped' | 'delivered';

export const STAGE_LABEL: Record<ShipmentStage, string> = {
  conferred: 'Conferido',
  labeled: 'Etiquetado',
  collected: 'Coletado',
  shipped: 'Expedido',
  delivered: 'Entregue',
};

export interface OrderRow {
  id: string;
  number: string;
  client_name: string;
  status: string;
  total: number;
  date: string;
  reserved_lines: number;
  picked_lines: number;
  shipped_lines: number;
  stage: 'reserved' | 'partial_picked' | 'picked' | 'shipped' | 'none';
}

export interface ShipmentInfo {
  id: string;
  shipment_number: string;
  status: string;
  carrier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface TrackingEvent {
  id: string;
  event_type: string;
  description: string;
  location: string | null;
  registered_by: string | null;
  occurred_at: string;
}

export interface StageForm {
  stage: ShipmentStage;
  tracking_number: string;
  carrier: string;
  location: string;
  notes: string;
}
