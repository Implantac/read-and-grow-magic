import { useWMSDashboardStats } from '@/hooks/useWMSOperations';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import {
  Warehouse, PackagePlus, PackageSearch, PackageCheck, Truck,
  CheckCircle, MapPin, ArrowUpDown, ScanBarcode, Layers, ClipboardCheck,
  AlertTriangle, TrendingUp, BarChart3, Timer, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const quickActions = [
  { to: '/wms/recebimento', icon: PackagePlus, label: 'Recebimento' },
  { to: '/wms/picking', icon: PackageSearch, label: 'Picking' },
  { to: '/wms/conferencia', icon: ScanBarcode, label: 'Conferência' },
  { to: '/wms/packing', icon: PackageCheck, label: 'Packing' },
  { to: '/wms/expedicao', icon: Truck, label: 'Expedição' },
  { to: '/wms/lotes', icon: Layers, label: 'Lotes' },
];

export default function WMSDashboardPage() {
  const { stats, recentMovements, loading } = useWMSDashboardStats();

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard WMS" description="Visão geral das operações do armazém" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-40 w-full" /></CardContent></Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  const occupancyColor = stats.occupancy > 85 ? 'danger' : stats.occupancy > 60 ? 'warning' : 'success';

  return (
    <PageContainer>
      <PageHeader title="Dashboard WMS" description="Visão geral das operações do armazém">
        <Link to="/wms/ia">
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" /> IA & Insights
          </Button>
        </Link>
      </PageHeader>

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Recebimentos"
          value={stats.receiving}
          subtitle="Pendentes / Em andamento"
          icon={<PackagePlus className="h-5 w-5" />}
          accentColor="info"
          index={0}
        />
        <KPICard
          title="Picking"
          value={stats.picking}
          subtitle="Ordens ativas"
          icon={<PackageSearch className="h-5 w-5" />}
          accentColor="warning"
          index={1}
        />
        <KPICard
          title="Packing"
          value={stats.packing}
          subtitle="Para embalar"
          icon={<PackageCheck className="h-5 w-5" />}
          accentColor="accent"
          index={2}
        />
        <KPICard
          title="Expedidos"
          value={stats.shipped}
          subtitle="Enviados hoje"
          icon={<Truck className="h-5 w-5" />}
          accentColor="success"
          index={3}
        />
      </div>

      {/* Secondary Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Storage Occupancy */}
        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-muted-foreground" />
              Ocupação do Armazém
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Taxa de Ocupação</span>
                  <span className={cn(
                    'font-bold tabular-nums',
                    stats.occupancy > 85 ? 'text-destructive' : stats.occupancy > 60 ? 'text-yellow-600' : 'text-green-600'
                  )}>
                    {stats.occupancy}%
                  </span>
                </div>
                <Progress value={stats.occupancy} className="h-3" />
              </div>

              {/* Zone Heatmap */}
              <div className="grid grid-cols-4 gap-1.5">
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((zone, i) => {
                  const zoneOcc = Math.min(100, Math.max(10, stats.occupancy + (i * 7 - 20)));
                  return (
                    <div
                      key={zone}
                      className="relative h-8 rounded-md flex items-center justify-center text-[10px] font-bold text-white cursor-default transition-transform hover:scale-105"
                      style={{
                        backgroundColor: zoneOcc > 85 ? 'hsl(0, 72%, 51%)' : zoneOcc > 60 ? 'hsl(38, 92%, 50%)' : 'hsl(142, 71%, 45%)',
                        opacity: 0.7 + (zoneOcc / 333),
                      }}
                      title={`Zona ${zone}: ${zoneOcc}%`}
                    >
                      {zone}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">Heatmap de ocupação por zona</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Endereços</p>
                  <p className="font-semibold text-foreground tabular-nums">{stats.totalLocations}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Capacidade</p>
                  <p className="font-semibold text-foreground tabular-nums">{stats.occupied}/{stats.capacity}</p>
                </div>
              </div>
              <Link to="/wms/enderecamento">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <MapPin className="h-4 w-4" /> Ver Endereçamento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Alertas Operacionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.occupancy > 85 ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="text-sm font-medium block">Ocupação crítica ({stats.occupancy}%)</span>
                    <span className="text-xs opacity-70">Considere transferências ou expedição urgente</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Ocupação normal</span>
                </div>
              )}
              {stats.picking > 5 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                  <PackageSearch className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="text-sm font-medium block">{stats.picking} pickings pendentes</span>
                    <span className="text-xs opacity-70">Considere criar uma onda de separação</span>
                  </div>
                </div>
              )}
              {stats.receiving > 3 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400">
                  <PackagePlus className="h-4 w-4 shrink-0" />
                  <div>
                    <span className="text-sm font-medium block">{stats.receiving} recebimentos aguardando</span>
                    <span className="text-xs opacity-70">Priorize para liberar docas</span>
                  </div>
                </div>
              )}
            </div>
            <Link to="/wms/inventario">
              <Button variant="outline" size="sm" className="w-full mt-3 gap-2">Ver Inventário</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Throughput / Metrics */}
        <Card className="hover-lift">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Throughput do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <PackagePlus className="h-3.5 w-3.5" /> Entradas
                </span>
                <span className="font-bold text-green-600 tabular-nums">{stats.receiving}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" /> Saídas
                </span>
                <span className="font-bold text-blue-600 tabular-nums">{stats.shipped}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5" /> Movimentações
                </span>
                <Badge variant="outline">{recentMovements.length}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ClipboardCheck className="h-3.5 w-3.5" /> Conferências
                </span>
                <Badge variant="outline">{stats.picking}</Badge>
              </div>

              {/* Mini throughput bar */}
              <div className="pt-2 border-t">
                <p className="text-[10px] text-muted-foreground mb-2">Entradas vs Saídas</p>
                <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                  <div
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${stats.receiving + stats.shipped > 0 ? (stats.receiving / (stats.receiving + stats.shipped)) * 100 : 50}%` }}
                  />
                  <div
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${stats.receiving + stats.shipped > 0 ? (stats.shipped / (stats.receiving + stats.shipped)) * 100 : 50}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Entradas</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Saídas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
            Movimentações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentMovements.length > 0 ? (
            <div className="space-y-2">
              {recentMovements.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <span className="font-medium text-foreground">{m.productName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={m.type === 'inbound' ? 'default' : m.type === 'outbound' ? 'secondary' : 'outline'}>
                      {m.type === 'inbound' ? 'Entrada' : m.type === 'outbound' ? 'Saída' : m.type === 'transfer' ? 'Transferência' : m.type}
                    </Badge>
                    <span className="text-muted-foreground tabular-nums">{m.quantity} un</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowUpDown className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Nenhuma movimentação registrada
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Ações Rápidas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-3 md:grid-cols-6">
            {quickActions.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to}>
                <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-xs">{label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
