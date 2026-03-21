import { useWMSDashboardStats } from '@/hooks/useWMSOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import {
  Warehouse, Package, PackagePlus, PackageSearch, PackageCheck, Truck,
  CheckCircle, MapPin, ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const kpiCards = [
  { key: 'receiving', label: 'Recebimentos', sub: 'Pendentes/Em andamento', icon: PackagePlus, accent: 'bg-info/10 text-info ring-info/20' },
  { key: 'picking', label: 'Picking', sub: 'Ordens ativas', icon: PackageSearch, accent: 'bg-warning/10 text-warning ring-warning/20' },
  { key: 'packing', label: 'Packing', sub: 'Para embalar', icon: PackageCheck, accent: 'bg-[hsl(263,70%,50%)]/10 text-[hsl(263,70%,50%)] ring-[hsl(263,70%,50%)]/20' },
  { key: 'shipped', label: 'Prontos p/ Expedição', sub: 'Aguardando envio', icon: Truck, accent: 'bg-success/10 text-success ring-success/20' },
] as const;

export default function WMSDashboardPage() {
  const { stats, recentMovements, loading } = useWMSDashboardStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-4 w-80" /></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard WMS</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão geral das operações do armazém</p>
      </div>

      {/* Main KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          const value = stats[kpi.key as keyof typeof stats];
          return (
            <Card key={kpi.key} className="hover-lift group cursor-default" style={{ animationDelay: `${idx * 80}ms` }}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                  </div>
                  <div className={cn('rounded-xl p-2.5 ring-1 transition-transform duration-200 group-hover:scale-110', kpi.accent)}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Storage Occupancy */}
        <Card>
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
                  <span className="font-semibold text-foreground">{stats.occupancy}%</span>
                </div>
                <Progress value={stats.occupancy} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Endereços</p>
                  <p className="font-semibold text-foreground">{stats.totalLocations}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Capacidade</p>
                  <p className="font-semibold text-foreground">{stats.occupied}/{stats.capacity}</p>
                </div>
              </div>
              <Link to="/wms/enderecamento">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <MapPin className="h-4 w-4" />
                  Ver Endereçamento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Nenhum alerta</span>
            </div>
            <Link to="/wms/inventario">
              <Button variant="outline" size="sm" className="w-full mt-3 gap-2">
                Ver Inventário
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Urgent Pickings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PackageSearch className="h-4 w-4 text-muted-foreground" />
              Pickings Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Nenhum picking urgente</span>
            </div>
            <Link to="/wms/picking">
              <Button variant="outline" size="sm" className="w-full mt-3 gap-2">
                Ver Todos Pickings
              </Button>
            </Link>
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
                <div key={m.id} className="flex items-center justify-between text-sm border-b border-border pb-2">
                  <span className="font-medium text-foreground">{m.productName}</span>
                  <span className="text-muted-foreground">{m.type} - {m.quantity} un</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma movimentação registrada
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Link to="/wms/recebimento">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5">
                <PackagePlus className="h-6 w-6 text-primary" />
                <span>Novo Recebimento</span>
              </Button>
            </Link>
            <Link to="/wms/picking">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5">
                <PackageSearch className="h-6 w-6 text-primary" />
                <span>Iniciar Picking</span>
              </Button>
            </Link>
            <Link to="/wms/movimentacoes">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5">
                <ArrowUpDown className="h-6 w-6 text-primary" />
                <span>Nova Movimentação</span>
              </Button>
            </Link>
            <Link to="/wms/inventario">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:border-primary/50 hover:bg-primary/5">
                <Package className="h-6 w-6 text-primary" />
                <span>Ajuste Inventário</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
