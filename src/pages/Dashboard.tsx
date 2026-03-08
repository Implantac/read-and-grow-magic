import { useAppStore } from '@/stores/useAppStore';
import { ModuleKPISection } from '@/components/dashboard/ModuleKPISection';
import { ConsolidatedCharts } from '@/components/dashboard/ConsolidatedCharts';
import { GlobalAlerts } from '@/components/dashboard/GlobalAlerts';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  ShoppingCart,
  Wallet,
  FileCheck,
  Package,
  Factory,
  Truck,
  Warehouse,
  DollarSign,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const iconMap = [DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle];

const colorClasses: Record<string, { bg: string; icon: string }> = {
  primary: { bg: 'bg-primary/10', icon: 'text-primary' },
  success: { bg: 'bg-success/10', icon: 'text-success' },
  warning: { bg: 'bg-warning/10', icon: 'text-warning' },
  info: { bg: 'bg-info/10', icon: 'text-info' },
};

// Fallback for charts when no data
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
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Consolidado</h1>
          <p className="text-muted-foreground">Carregando dados...</p>
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Consolidado</h1>
        <p className="text-muted-foreground">
          Visão geral de todos os módulos • {user?.name} • {activeCompany?.name} - {activeBranch?.name}
        </p>
      </div>

      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainKPIs.map((kpi, idx) => {
          const Icon = iconMap[idx] || DollarSign;
          const colors = colorClasses[kpi.color] || colorClasses.primary;
          return (
            <Card key={kpi.title} className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p className={cn(
                      "text-xs font-medium",
                      kpi.change >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change).toFixed(1)}%
                    </p>
                  </div>
                  <div className={cn('rounded-xl p-3', colors.bg)}>
                    <Icon className={cn('h-6 w-6', colors.icon)} />
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
