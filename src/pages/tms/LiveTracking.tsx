import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/base/card';
import { Badge } from '@/ui/base/badge';
import { Button } from '@/ui/base/button';
import { Progress } from '@/ui/base/progress';
import { Truck, Navigation, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLiveRoutes } from '@/hooks/tms/useRoutePlanning';
import { useTMS } from '@/hooks/operational/useTMSQuery';

const STATUS_BADGE: Record<string, { label: string; tone: string }> = {
  planned: { label: 'Planejada', tone: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  in_transit: { label: 'Em trânsito', tone: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  completed: { label: 'Concluída', tone: 'bg-green-500/10 text-green-400 border-green-500/30' },
  cancelled: { label: 'Cancelada', tone: 'bg-red-500/10 text-red-400 border-red-500/30' },
};

const LiveTracking = () => {
  const { data: routes = [], isLoading } = useLiveRoutes();
  const { carriers, vehicles, carriersLoading, vehiclesLoading } = useTMS();

  const stats = useMemo(() => {
    const inTransit = routes.filter((r: any) => r.status === 'in_transit').length;
    const planned = routes.filter((r: any) => r.status === 'planned').length;
    const totalStops = routes.reduce((s: number, r: any) => s + (r.total_stops ?? 0), 0);
    const completedStops = routes.reduce((s: number, r: any) => s + (r.completed_stops ?? 0), 0);
    return { inTransit, planned, totalStops, completedStops };
  }, [routes]);

  if (isLoading || carriersLoading || vehiclesLoading) return <PageLoading />;

  const findCarrier = (id?: string | null) => carriers.find((c) => c.id === id)?.name ?? '—';
  const findVehicle = (id?: string | null) => vehicles.find((v) => v.id === id)?.plate ?? '—';

  return (
    <PageContainer>
      <PageHeader
        title="Rastreamento ao vivo"
        description="Acompanhamento em tempo real das rotas planejadas e em trânsito (atualiza automaticamente)."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Em trânsito" value={stats.inTransit} icon={<Navigation className="h-5 w-5" />} accentColor="warning" index={0} />
        <KPICard title="Planejadas" value={stats.planned} icon={<MapPin className="h-5 w-5" />} accentColor="info" index={1} />
        <KPICard title="Paradas concluídas" value={`${stats.completedStops}/${stats.totalStops}`} icon={<CheckCircle2 className="h-5 w-5" />} accentColor="success" index={2} />
        <KPICard
          title="Progresso geral"
          value={stats.totalStops > 0 ? `${Math.round((stats.completedStops / stats.totalStops) * 100)}%` : '—'}
          icon={<Truck className="h-5 w-5" />}
          accentColor="primary"
          index={3}
        />
      </div>

      {routes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
            Nenhuma rota planejada ou em trânsito no momento.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {routes.map((r: any) => {
            const pct = r.total_stops > 0 ? Math.round((r.completed_stops / r.total_stops) * 100) : 0;
            const badge = STATUS_BADGE[r.status] ?? { label: r.status, tone: 'bg-muted text-foreground' };
            return (
              <Card key={r.id} className="hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{r.route_number ?? r.id.slice(0, 8)}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.planned_date} · {findCarrier(r.carrier_id)} · {findVehicle(r.vehicle_id)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded border ${badge.tone}`}>{badge.label}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Paradas</span>
                      <span>{r.completed_stops}/{r.total_stops} · {pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Motorista: {r.driver_name ?? '—'}</span>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/tms/rotas/${r.id}/planejamento`}>Abrir planner</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
        <Badge variant="outline" className="text-[10px] px-1 py-0">LIVE</Badge>
        Atualizações via Realtime — paradas marcadas como concluídas aparecem aqui em segundos.
      </p>
    </PageContainer>
  );
};

export default LiveTracking;
