import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DoorOpen, Truck, Clock, CheckCircle } from 'lucide-react';
import { useLoadingDocks } from '@/hooks/useLoadingDocks';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  free: { label: 'Livre', variant: 'outline', color: 'border-green-500' },
  reserved: { label: 'Reservada', variant: 'secondary', color: 'border-amber-500' },
  loading: { label: 'Carregando', variant: 'default', color: 'border-primary' },
  unloading: { label: 'Descarregando', variant: 'default', color: 'border-blue-500' },
  occupied: { label: 'Ocupada', variant: 'destructive', color: 'border-destructive' },
};

export default function DocksPage() {
  const { docks, loading, updateStatus } = useLoadingDocks();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const free = docks.filter(d => d.status === 'free').length;
  const busy = docks.filter(d => d.status !== 'free').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Docas de Carregamento</h1>
        <p className="text-muted-foreground">Gestão de docas para recebimento e expedição</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{docks.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livres</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{free}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupadas</CardTitle>
            <Truck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-500">{busy}</div></CardContent>
        </Card>
      </div>

      {docks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {docks.map(dock => {
            const cfg = statusConfig[dock.status] || statusConfig.free;
            return (
              <Card key={dock.id} className={`border-l-4 ${cfg.color}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{dock.dockCode}</CardTitle>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  {dock.dockName && <p className="text-sm text-muted-foreground">{dock.dockName}</p>}
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Tipo:</span> {dock.dockType === 'inbound' ? 'Recebimento' : dock.dockType === 'outbound' ? 'Expedição' : 'Ambos'}</p>
                  {dock.carrier && <p><span className="text-muted-foreground">Transp:</span> {dock.carrier}</p>}
                  {dock.vehiclePlate && <p><span className="text-muted-foreground">Placa:</span> {dock.vehiclePlate}</p>}
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
    </div>
  );
}
