import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { ScrollArea } from '@/ui/base/scroll-area';
import { EmptyState } from '@/shared/components/EmptyState';
import { Truck, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { statusBadge, type Dock, type YardVehicle } from './types';

interface Props {
  vehicles: YardVehicle[];
  loading: boolean;
  docks: Dock[];
  dockLabel: (id: string | null) => string;
  onUpdate: (args: { id: string; status: string; dock_id?: string | null }) => void;
}

export function VehiclesList({ vehicles, loading, docks, dockLabel, onUpdate }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Veículos no pátio ({vehicles.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[520px] pr-3">
          {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!loading && vehicles.length === 0 && (
            <EmptyState icon={Truck} title="Pátio vazio" description="Faça o check-in de veículos que estão chegando para gerenciar docas e prioridades." />
          )}
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center gap-3 border rounded-lg p-3">
                <Truck className="h-4 w-4 text-primary" />
                <span className="font-mono font-semibold">{v.plate}</span>
                <Badge variant="outline" className="text-[10px] uppercase">{v.operation_type}</Badge>
                <Badge variant="outline" className={`text-[10px] uppercase ${statusBadge[v.status] || ''}`}>{v.status}</Badge>
                <span className="text-xs text-muted-foreground">{v.carrier_name || '—'}</span>
                <span className="text-xs text-muted-foreground">Doca: {dockLabel(v.dock_id)}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  Chegou {format(new Date(v.arrived_at), 'dd/MM HH:mm', { locale: ptBR })}
                </span>
                <div className="flex gap-1 w-full sm:w-auto pt-2 sm:pt-0">
                  {v.status === 'waiting' && (
                    <Select onValueChange={(dockId) => onUpdate({ id: v.id, status: 'docked', dock_id: dockId })}>
                      <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Atribuir doca" /></SelectTrigger>
                      <SelectContent>
                        {docks.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name || d.code || d.id.slice(0, 6)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {['docked', 'loading', 'unloading'].includes(v.status) && (
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => onUpdate({ id: v.id, status: 'finished' })}>
                      <LogOut className="h-3 w-3" /> Liberar
                    </Button>
                  )}
                  {v.status !== 'finished' && v.status !== 'cancelled' && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onUpdate({ id: v.id, status: 'cancelled' })}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
