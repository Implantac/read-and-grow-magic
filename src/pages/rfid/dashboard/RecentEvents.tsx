import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Skeleton } from '@/ui/base/skeleton';

const typeLabels: Record<string, string> = { read: 'Leitura', entry: 'Entrada', exit: 'Saída', transfer: 'Transfer.', inventory: 'Inventário' };
const typeColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { read: 'secondary', entry: 'default', exit: 'destructive', transfer: 'outline', inventory: 'default' };

export function RecentEvents({ loading, events }: { loading: boolean; events: any[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          Últimas Leituras
          <Badge variant="outline" className="animate-pulse text-[10px]">TEMPO REAL</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-[120px] w-full" /> : events.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">Nenhum evento registrado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {events.slice(0, 8).map(event => (
              <div key={event.id} className="p-3 rounded-lg border bg-card/50 hover:bg-accent/30 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={typeColors[event.eventType] || 'secondary'} className="text-[10px]">
                    {typeLabels[event.eventType] || event.eventType}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{format(new Date(event.createdAt), 'HH:mm:ss')}</span>
                </div>
                <p className="text-xs font-mono truncate text-foreground">{event.tagEpc}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{event.readerCode} • {event.zone || '-'}</p>
                {event.rssi != null && <p className="text-[10px] text-muted-foreground">RSSI: {event.rssi} dBm</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
