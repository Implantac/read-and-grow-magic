import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { DoorOpen, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import { useLoadingDocks } from '@/hooks/wms/useLoadingDocks';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  free: { label: 'Livre', variant: 'outline', color: 'border-l-green-500' },
  reserved: { label: 'Reservada', variant: 'secondary', color: 'border-l-amber-500' },
  loading: { label: 'Carregando', variant: 'default', color: 'border-l-primary' },
  unloading: { label: 'Descarregando', variant: 'default', color: 'border-l-blue-500' },
  occupied: { label: 'Ocupada', variant: 'destructive', color: 'border-l-destructive' },
};

const dockTypeLabels: Record<string, string> = { inbound: 'Recebimento', outbound: 'Expedição', both: 'Ambos' };

export default function DocksPage() {
  const { docks, loading, updateStatus } = useLoadingDocks();

  const free = docks.filter(d => d.status === 'free').length;
  const busy = docks.filter(d => d.status !== 'free').length;

  return (
    <PageContainer loading={loading}>
      <PageHeader title="Docas de Carregamento" description="Gestão de docas para recebimento e expedição" />

      <div className="grid gap-4 md:grid-cols-4">
        <KPICard title="Total de Docas" value={docks.length} icon={DoorOpen} index={0} />
        <KPICard title="Livres" value={free} icon={CheckCircle} index={1} color="success" />
        <KPICard title="Ocupadas" value={busy} icon={Truck} index={2} color={busy > 0 ? 'warning' : undefined} />
        <KPICard title="Taxa Ocupação" value={docks.length > 0 ? `${Math.round((busy / docks.length) * 100)}%` : '0%'} icon={AlertTriangle} index={3} />
      </div>

      {docks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {docks.map(dock => {
            const cfg = statusConfig[dock.status] || statusConfig.free;
            return (
              <Card key={dock.id} className={`border-l-4 ${cfg.color} hover-lift`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-mono">{dock.dockCode}</CardTitle>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  {dock.dockName && <p className="text-sm text-muted-foreground">{dock.dockName}</p>}
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Badge variant="outline" className="text-xs">{dockTypeLabels[dock.dockType] || dock.dockType}</Badge>
                  {dock.carrier && <p><span className="text-muted-foreground">Transp:</span> <span className="font-medium">{dock.carrier}</span></p>}
                  {dock.vehiclePlate && <p><span className="text-muted-foreground">Placa:</span> <span className="font-mono">{dock.vehiclePlate}</span></p>}
                  {dock.driverName && <p><span className="text-muted-foreground">Motorista:</span> {dock.driverName}</p>}
                  {dock.status !== 'free' && (
                    <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => updateStatus(dock.id, 'free', { carrier: null, vehicle_plate: null, driver_name: null })}>
                      Liberar Doca
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <DoorOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma doca cadastrada</h3>
            <p>Cadastre as docas do armazém para controlar carga e descarga.</p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
