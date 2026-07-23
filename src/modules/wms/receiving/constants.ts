import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  in_progress: { label: 'Em Andamento', variant: 'default' },
  completed: { label: 'Concluído', variant: 'outline' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

export function formatDate(date: string) {
  if (!date) return '-';
  try { return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR }); }
  catch { return '-'; }
}
