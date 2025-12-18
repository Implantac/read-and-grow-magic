import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrderStatus, SaleStatus } from '@/types/commercial';

type StatusVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary';

interface StatusConfig {
  label: string;
  variant: StatusVariant;
}

const orderStatusConfig: Record<OrderStatus, StatusConfig> = {
  pending: { label: 'Pendente', variant: 'warning' },
  confirmed: { label: 'Confirmado', variant: 'info' },
  processing: { label: 'Processando', variant: 'info' },
  separated: { label: 'Separado', variant: 'secondary' },
  invoiced: { label: 'Faturado', variant: 'default' },
  shipped: { label: 'Enviado', variant: 'info' },
  delivered: { label: 'Entregue', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
};

const saleStatusConfig: Record<SaleStatus, StatusConfig> = {
  completed: { label: 'Concluída', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  refunded: { label: 'Devolvida', variant: 'warning' },
};

const clientStatusConfig: Record<string, StatusConfig> = {
  active: { label: 'Ativo', variant: 'success' },
  inactive: { label: 'Inativo', variant: 'secondary' },
  blocked: { label: 'Bloqueado', variant: 'destructive' },
};

const priorityConfig: Record<string, StatusConfig> = {
  low: { label: 'Baixa', variant: 'secondary' },
  medium: { label: 'Média', variant: 'default' },
  high: { label: 'Alta', variant: 'warning' },
  urgent: { label: 'Urgente', variant: 'destructive' },
};

const variantStyles: Record<StatusVariant, string> = {
  default: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-info/10 text-info border-info/20',
  secondary: 'bg-muted text-muted-foreground border-border',
};

interface StatusBadgeProps {
  type: 'order' | 'sale' | 'client' | 'priority';
  status: string;
  className?: string;
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
  let config: StatusConfig;

  switch (type) {
    case 'order':
      config = orderStatusConfig[status as OrderStatus] || { label: status, variant: 'default' };
      break;
    case 'sale':
      config = saleStatusConfig[status as SaleStatus] || { label: status, variant: 'default' };
      break;
    case 'client':
      config = clientStatusConfig[status] || { label: status, variant: 'default' };
      break;
    case 'priority':
      config = priorityConfig[status] || { label: status, variant: 'default' };
      break;
    default:
      config = { label: status, variant: 'default' };
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        variantStyles[config.variant],
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
