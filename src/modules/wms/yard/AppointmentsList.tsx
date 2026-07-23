import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { ScrollArea } from '@/ui/base/scroll-area';
import { EmptyState } from '@/shared/components/EmptyState';
import { CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { statusBadge, type YardAppointment } from './types';

interface Props {
  appts: YardAppointment[];
  loading: boolean;
  dockLabel: (id: string | null) => string;
}

export function AppointmentsList({ appts, loading, dockLabel }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Agenda de docas ({appts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[520px] pr-3">
          {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!loading && appts.length === 0 && (
            <EmptyState icon={CalendarClock} title="Sem agendamentos" description="Programe janelas de docas para coletas e entregas evitando fila no pátio." />
          )}
          <div className="space-y-2">
            {appts.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 border rounded-lg p-3">
                <CalendarClock className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  {format(new Date(a.scheduled_start), 'dd/MM HH:mm', { locale: ptBR })} → {format(new Date(a.scheduled_end), 'HH:mm', { locale: ptBR })}
                </span>
                <Badge variant="outline" className="text-[10px] uppercase">{a.operation_type}</Badge>
                <Badge variant="outline" className={`text-[10px] uppercase ${statusBadge[a.status] || ''}`}>{a.status}</Badge>
                <span className="text-xs text-muted-foreground">Doca: {dockLabel(a.dock_id)}</span>
                <span className="text-xs text-muted-foreground">{a.carrier_name || '—'} {a.plate ? `· ${a.plate}` : ''}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
