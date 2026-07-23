export interface YardVehicle {
  id: string;
  plate: string;
  carrier_name: string | null;
  driver_name: string | null;
  vehicle_type: string;
  operation_type: string;
  status: string;
  dock_id: string | null;
  linked_order: string | null;
  arrived_at: string;
  docked_at: string | null;
  finished_at: string | null;
  notes: string | null;
}

export interface YardAppointment {
  id: string;
  dock_id: string;
  carrier_name: string | null;
  plate: string | null;
  operation_type: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  linked_order: string | null;
}

export interface Dock {
  id: string;
  name?: string;
  code?: string;
}

export const statusBadge: Record<string, string> = {
  waiting: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  docked: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  loading: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  unloading: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  finished: 'bg-green-500/15 text-green-600 border-green-500/30',
  cancelled: 'bg-muted text-muted-foreground',
  scheduled: 'bg-violet-500/15 text-violet-600 border-violet-500/30',
  confirmed: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  in_progress: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  done: 'bg-green-500/15 text-green-600 border-green-500/30',
  no_show: 'bg-destructive/15 text-destructive border-destructive/30',
};
