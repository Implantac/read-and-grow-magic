import { Badge } from '@/ui/base/badge';
import { Radio, RadioTower, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWMSInventory } from '@/hooks/wms/useWMSInventory';

interface RealtimeStatusProps {
  className?: string;
}

/**
 * Indicador de status de conexão em tempo real para o inventário WMS.
 * Mostra visualmente se o canal está conectado, reconectando ou com erro.
 */
export function RealtimeStatus({ className }: RealtimeStatusProps) {
  const { realtimeStatus } = useWMSInventory();

  const statusConfig = {
    connected: {
      label: 'Ao vivo',
      icon: <RadioTower className="h-3 w-3 animate-pulse" />,
      variant: 'default' as const,
      className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
    },
    reconnecting: {
      label: 'Reconectando...',
      icon: <Radio className="h-3 w-3 animate-spin" />,
      variant: 'outline' as const,
      className: 'text-amber-500 border-amber-500/30 animate-pulse'
    },
    error: {
      label: 'Falha na conexão',
      icon: <AlertTriangle className="h-3 w-3" />,
      variant: 'destructive' as const,
      className: 'bg-destructive/15 text-destructive border-destructive/30'
    }
  };

  const config = statusConfig[realtimeStatus];

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'gap-1.5 font-normal transition-all duration-300',
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
