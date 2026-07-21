import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { useOfflinePDV } from '@/hooks/pdv/useOfflinePDV';

export function OfflinePDVIndicator() {
  const { online, queueSize, syncing, flush } = useOfflinePDV();

  if (online && queueSize === 0) {
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
        <Wifi className="h-3 w-3 mr-1" /> Online
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!online ? (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
          <WifiOff className="h-3 w-3 mr-1" /> Offline
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
          <Wifi className="h-3 w-3 mr-1" /> Online
        </Badge>
      )}
      {queueSize > 0 && (
        <>
          <Badge variant="secondary">{queueSize} na fila</Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={flush}
            disabled={!online || syncing}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </>
      )}
    </div>
  );
}
