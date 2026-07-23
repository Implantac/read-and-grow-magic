export type Appt = {
  id: string;
  dock_id: string | null;
  carrier_name: string | null;
  plate: string | null;
  operation_type: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  linked_order: string | null;
  notes: string | null;
};

export type Dock = { id: string; name: string; type: string | null; status: string | null };

export const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Agendado',
  arrived: 'Chegou',
  in_progress: 'Em operação',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

export const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'outline',
  arrived: 'secondary',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
  no_show: 'destructive',
};

export function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 22;
