import { Badge } from '@/ui/base/badge';
import { Radio, RadioTower } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeWMS } from '@/hooks/wms/useRealtimeWMS';

interface RealtimeStatusProps {
  onEvent?: (table: string) => void;
  className?: string;
}

/**
 * Badge visual "ao vivo" que assina os canais realtime do WMS.
 * Basta renderizar em qualquer página do módulo para ativar a sincronização.
 */
export function RealtimeStatus({ onEvent, className }: RealtimeStatusProps) {
  const { connected, lastEventAt } = useRealtimeWMS(onEvent);

  return (
    <Badge
      variant={connected ? 'default' : 'outline'}
      className={cn(
        'gap-1.5 font-normal',
        connected ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20' : '',
        className,
      )}
      title={
        lastEventAt
          ? `Última atualização: ${lastEventAt.toLocaleTimeString('pt-BR')}`
          : 'Aguardando eventos em tempo real'
      }
    >
      {connected ? (
        <RadioTower className="h-3 w-3 animate-pulse" />
      ) : (
        <Radio className="h-3 w-3" />
      )}
      {connected ? 'Ao vivo' : 'Conectando...'}
    </Badge>
  );
}
