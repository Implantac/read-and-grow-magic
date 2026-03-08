import { useAppStore } from '@/stores/useAppStore';
import { ModuleKPISection } from '@/components/dashboard/ModuleKPISection';
import { ConsolidatedCharts } from '@/components/dashboard/ConsolidatedCharts';
import { GlobalAlerts } from '@/components/dashboard/GlobalAlerts';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  ShoppingCart, Wallet, Package, Factory, Truck, Warehouse,
  DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const iconMap = [DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle];

const colorClasses: Record<string, { bg: string; icon: string; ring: string }> = {
  primary: { bg: 'bg-primary/10', icon: 'text-primary', ring: 'ring-primary/20' },
  success: { bg: 'bg-success/10', icon: 'text-success', ring: 'ring-success/20' },
  warning: { bg: 'bg-warning/10', icon: 'text-warning', ring: 'ring-warning/20' },
  info: { bg: 'bg-info/10', icon: 'text-info', ring: 'ring-info/20' },
};

const emptyModulePerformance = [
  { name: 'Comercial', value: 0, color: 'hsl(var(--primary))' },
  { name: 'Financeiro', value: 0, color: 'hsl(var(--success))' },
  { name: 'Estoque', value: 0, color: 'hsl(var(--info))' },
  { name: 'WMS', value: 0, color: 'hsl(var(--warning))' },
  { name: 'Produção', value: 0, color: 'hsl(142, 76%, 36%)' },
  { name: 'Compras', value: 0, color: 'hsl(262, 83%, 58%)' },
];

export default function Dashboard() {
  const { user, activeCompany, activeBranch } = useAppStore();
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-72 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const {
    mainKPIs = [], commercialKPIs = [], financialKPIs = [], inventoryKPIs = [],
    productionKPIs = [], purchasingKPIs = [], wmsKPIs = [],
    statusDistribution = [], alerts = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard Consolidado</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão geral • {activeCompany?.name}{activeBranch ? ` - ${activeBranch.name}` : ''}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Atualizado a cada 60s
        </p>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainKPIs.map((kpi, idx) => {
          const Icon = iconMap[idx] || DollarSign;
          const colors = colorClasses[kpi.color] || colorClasses.primary;
          return (
            <Card key={kpi.title} className="hover-lift group cursor-default">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.title}</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{kpi.value}</p>
                    <div className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                      kpi.change >= 0
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    )}>
                      {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change).toFixed(1)}%
                    </div>
                  </div>
                  <div className={cn('rounded-xl p-2.5 ring-1', colors.bg, colors.ring)}>
                    <Icon className={cn('h-5 w-5', colors.icon)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* KPIs por Módulo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ModuleKPISection title="Comercial" icon={ShoppingCart} kpis={commercialKPIs} accentColor="bg-primary" />
        <ModuleKPISection title="Financeiro" icon={Wallet} kpis={financialKPIs} accentColor="bg-success" />
        <ModuleKPISection title="Estoque" icon={Package} kpis={inventoryKPIs} accentColor="bg-info" />
        <ModuleKPISection title="WMS" icon={Warehouse} kpis={wmsKPIs} accentColor="bg-warning" />
        <ModuleKPISection title="Produção" icon={Factory} kpis={productionKPIs} accentColor="bg-[hsl(142,76%,36%)]" />
        <ModuleKPISection title="Compras" icon={Truck} kpis={purchasingKPIs} accentColor="bg-[hsl(262,83%,58%)]" />
      </div>

      {/* Gráficos Consolidados */}
      <ConsolidatedCharts
        modulePerformance={emptyModulePerformance}
        statusDistribution={statusDistribution}
      />

      {/* Alertas + Faturamento + Atividades */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlobalAlerts alerts={alerts} />
        <RevenueChart />
        <RecentActivities />
      </div>
    </div>
  );
}
