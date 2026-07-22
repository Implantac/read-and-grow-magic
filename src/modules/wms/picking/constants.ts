import type { PickingStatus } from '@/types/wms';

export const statusConfig: Record<PickingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  assigned: { label: 'Atribuído', variant: 'default' },
  in_progress: { label: 'Em Andamento', variant: 'default' },
  completed: { label: 'Concluído', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

export const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'bg-muted-foreground' },
  medium: { label: 'Média', color: 'bg-blue-500' },
  high: { label: 'Alta', color: 'bg-yellow-500' },
  urgent: { label: 'Urgente', color: 'bg-destructive' },
};
