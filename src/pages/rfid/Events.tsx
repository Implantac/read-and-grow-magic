import { useRFID } from '@/hooks/system/useRFIDQuery';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Button } from '@/ui/base/button';
import { Badge } from '@/ui/base/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/base/table';
import { RefreshCw, Activity, Radio, CheckCircle, AlertCircle } from 'lucide-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const eventTypeLabels: Record<string, string> = {
  read: 'Leitura', entry: 'Entrada', exit: 'Saída', transfer: 'Transferência', inventory: 'Inventário',
};
const eventTypeColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  read: 'secondary', entry: 'default', exit: 'destructive', transfer: 'outline', inventory: 'default',
};

export default function RFIDEventsPage() {
  const { readers, tags, getEvents } = useRFID();
  const { data: events = [], isLoading: loading } = getEvents(200);
  
  const summary = useMemo(() => ({
    totalReaders: readers.length,
    activeReaders: readers.filter(r => r.status === 'active').length,
    totalTags: tags.length,
    activeTags: tags.filter(t => t.status === 'active').length,
    eventsToday: events.length, 
    unprocessedEvents: events.filter(e => !e.processed).length,
  }), [readers, tags, events]);

  const refetch = () => {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Eventos RFID</h1>
          <p className="text-muted-foreground">Monitoramento em tempo real das leituras RFID</p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}><RefreshCw className="h-4 w-4 mr-1" /> Atualizar</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{summary.eventsToday}</p><p className="text-xs text-muted-foreground">Eventos Hoje</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-amber-500" />
          <div><p className="text-2xl font-bold">{summary.unprocessedEvents}</p><p className="text-xs text-muted-foreground">Não Processados</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Radio className="h-8 w-8 text-green-500" />
          <div><p className="text-2xl font-bold">{summary.activeReaders}</p><p className="text-xs text-muted-foreground">Leitores Ativos</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-blue-500" />
          <div><p className="text-2xl font-bold">{summary.activeTags}</p><p className="text-xs text-muted-foreground">Tags Ativas</p></div>
        </CardContent></Card>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Últimos Eventos
            <Badge variant="outline" className="animate-pulse">TEMPO REAL</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : events.length === 0 ? (
            <EmptyState icon={Activity} title="Sem eventos RFID" description="Os eventos aparecerão aqui em tempo real quando os leitores capturarem tags." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tag EPC</TableHead>
                  <TableHead>Leitor</TableHead>
                  <TableHead>Zona</TableHead>
                  <TableHead>RSSI</TableHead>
                  <TableHead>Antena</TableHead>
                  <TableHead>Processado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map(event => (
                  <TableRow key={event.id}>
                    <TableCell className="text-xs">{format(new Date(event.createdAt), "dd/MM/yy HH:mm:ss", { locale: ptBR })}</TableCell>
                    <TableCell><Badge variant={eventTypeColors[event.eventType] || 'secondary'}>{eventTypeLabels[event.eventType] || event.eventType}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{event.tagEpc}</TableCell>
                    <TableCell className="font-mono text-xs">{event.readerCode}</TableCell>
                    <TableCell>{event.zone || event.location || '-'}</TableCell>
                    <TableCell className="text-center">{event.rssi != null ? `${event.rssi} dBm` : '-'}</TableCell>
                    <TableCell className="text-center">{event.antenna}</TableCell>
                    <TableCell>
                      {event.processed 
                        ? <Badge variant="default">Sim</Badge> 
                        : <Badge variant="outline">Não</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
