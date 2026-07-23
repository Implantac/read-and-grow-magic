import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { EmptyState } from '@/shared/components/EmptyState';
import { CalendarClock } from 'lucide-react';
import { STATUS_LABEL, STATUS_VARIANT, type Appt, type Dock } from './types';

export function AppointmentsList({
  appts, docks, onChangeStatus,
}: { appts: Appt[]; docks: Dock[]; onChangeStatus: (id: string, status: string) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle>Agendamentos do dia</CardTitle></CardHeader>
      <CardContent>
        {appts.length === 0 ? (
          <EmptyState
            compact
            icon={CalendarClock}
            title="Nenhum agendamento para hoje"
            description="Agende janelas de doca para transportadoras a fim de organizar recebimento e expedição."
          />
        ) : (
          <div className="space-y-2">
            {appts.map((a) => {
              const dock = docks.find((d) => d.id === a.dock_id);
              return (
                <div key={a.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[a.status] || 'outline'}>{STATUS_LABEL[a.status] || a.status}</Badge>
                      <span className="text-sm font-medium">{dock?.name || '—'}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.scheduled_start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} →
                        {' '}{new Date(a.scheduled_end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.carrier_name || '—'} • {a.plate || '—'} • {a.operation_type === 'inbound' ? 'Recebimento' : 'Expedição'}
                      {a.linked_order ? ` • Pedido ${a.linked_order}` : ''}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {a.status === 'scheduled' && (
                      <Button size="sm" variant="outline" onClick={() => onChangeStatus(a.id, 'arrived')}>Chegou</Button>
                    )}
                    {(a.status === 'scheduled' || a.status === 'arrived') && (
                      <Button size="sm" onClick={() => onChangeStatus(a.id, 'in_progress')}>Iniciar</Button>
                    )}
                    {a.status === 'in_progress' && (
                      <Button size="sm" onClick={() => onChangeStatus(a.id, 'completed')}>Concluir</Button>
                    )}
                    {a.status === 'scheduled' && (
                      <Button size="sm" variant="destructive" onClick={() => onChangeStatus(a.id, 'no_show')}>No-show</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
