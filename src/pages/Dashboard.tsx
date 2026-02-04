import { useAppStore } from '@/stores/useAppStore';
import { ModuleKPISection } from '@/components/dashboard/ModuleKPISection';
import { ConsolidatedCharts } from '@/components/dashboard/ConsolidatedCharts';
import { GlobalAlerts } from '@/components/dashboard/GlobalAlerts';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// KPIs consolidados por módulo
const commercialKPIs = [
  { label: 'Faturamento Mensal', value: 'R$ 1.285.430', trend: 'up' as const, trendValue: '+12.5%' },
  { label: 'Pedidos Hoje', value: '156', trend: 'down' as const, trendValue: '-3.2%' },
  { label: 'Clientes Ativos', value: '248', trend: 'up' as const, trendValue: '+5' },
  { label: 'Ticket Médio', value: 'R$ 8.240', trend: 'up' as const, trendValue: '+8.3%' },
];

const financialKPIs = [
  { label: 'A Receber', value: 'R$ 173.850', trend: 'neutral' as const },
  { label: 'A Pagar', value: 'R$ 232.000', trend: 'neutral' as const },
  { label: 'Saldo Atual', value: 'R$ 83.150', trend: 'up' as const, trendValue: '+15%' },
  { label: 'Vencidos', value: 'R$ 57.000', trend: 'down' as const, trendValue: '2 títulos' },
];

const inventoryKPIs = [
  { label: 'SKUs Ativos', value: '12.458', trend: 'up' as const, trendValue: '+45' },
  { label: 'Valor em Estoque', value: 'R$ 2.4M', trend: 'neutral' as const },
  { label: 'Itens Críticos', value: '15', trend: 'down' as const, trendValue: 'atenção' },
  { label: 'Giro Médio', value: '4.2x', trend: 'up' as const, trendValue: '+0.3' },
];

const wmsKPIs = [
  { label: 'Recebimentos Pend.', value: '2', trend: 'neutral' as const },
  { label: 'Pickings Ativos', value: '3', trend: 'neutral' as const },
  { label: 'Ocupação', value: '68%', trend: 'neutral' as const },
  { label: 'Produtividade', value: '94.2%', trend: 'up' as const, trendValue: '+5.7%' },
];

const productionKPIs = [
  { label: 'OPs em Andamento', value: '2', trend: 'neutral' as const },
  { label: 'Produzido Hoje', value: '150 un', trend: 'up' as const, trendValue: '+12%' },
  { label: 'Eficiência', value: '94.5%', trend: 'up' as const, trendValue: '+2.1%' },
  { label: 'On-Time Delivery', value: '92.3%', trend: 'neutral' as const },
];

const purchasingKPIs = [
  { label: 'Pedidos Abertos', value: '6', trend: 'neutral' as const },
  { label: 'Aguardando Aprov.', value: '1', trend: 'neutral' as const },
  { label: 'Em Trânsito', value: 'R$ 11.129', trend: 'neutral' as const },
  { label: 'Fornecedores Ativos', value: '4', trend: 'neutral' as const },
];

// Dados para gráficos consolidados
const modulePerformance = [
  { name: 'Comercial', value: 95, color: 'hsl(var(--primary))' },
  { name: 'Financeiro', value: 88, color: 'hsl(var(--success))' },
  { name: 'Estoque', value: 92, color: 'hsl(var(--info))' },
  { name: 'WMS', value: 94, color: 'hsl(var(--warning))' },
  { name: 'Produção', value: 94.5, color: 'hsl(142, 76%, 36%)' },
  { name: 'Compras', value: 85, color: 'hsl(262, 83%, 58%)' },
];

const statusDistribution = [
  { name: 'Concluído', value: 245, color: 'hsl(var(--success))' },
  { name: 'Em Andamento', value: 89, color: 'hsl(var(--info))' },
  { name: 'Pendente', value: 47, color: 'hsl(var(--warning))' },
  { name: 'Crítico', value: 12, color: 'hsl(var(--destructive))' },
];

// Alertas globais
const globalAlerts = [
  { id: '1', type: 'error' as const, module: 'Financeiro', message: '3 contas a pagar vencidas (R$ 45.000)', timestamp: 'Há 2h' },
  { id: '2', type: 'warning' as const, module: 'Estoque', message: '15 produtos abaixo do estoque mínimo', timestamp: 'Há 3h' },
  { id: '3', type: 'warning' as const, module: 'WMS', message: '8 ordens de picking aguardando há mais de 2h', timestamp: 'Há 4h' },
  { id: '4', type: 'info' as const, module: 'Comercial', message: 'Novo pedido grande: Cliente ABC Corp (R$ 45.000)', timestamp: 'Há 5h' },
  { id: '5', type: 'success' as const, module: 'Produção', message: 'OP-2024-001 concluída com 100% de eficiência', timestamp: 'Há 6h' },
  { id: '6', type: 'warning' as const, module: 'Compras', message: '1 pedido aguardando aprovação', timestamp: 'Há 7h' },
];

// KPIs principais do topo
const mainKPIs = [
  { title: 'Faturamento Mensal', value: 'R$ 1.285.430', change: 12.5, icon: DollarSign, color: 'primary' },
  { title: 'Lucro Líquido', value: 'R$ 248.920', change: 8.3, icon: TrendingUp, color: 'success' },
  { title: 'A Receber', value: 'R$ 173.850', change: 5.2, icon: ArrowDownCircle, color: 'info' },
  { title: 'A Pagar', value: 'R$ 232.000', change: -3.1, icon: ArrowUpCircle, color: 'warning' },
];

const colorClasses: Record<string, { bg: string; icon: string }> = {
  primary: { bg: 'bg-primary/10', icon: 'text-primary' },
  success: { bg: 'bg-success/10', icon: 'text-success' },
  warning: { bg: 'bg-warning/10', icon: 'text-warning' },
  info: { bg: 'bg-info/10', icon: 'text-info' },
};

export default function Dashboard() {
  const { user, activeCompany, activeBranch } = useAppStore();

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
        {mainKPIs.map((kpi) => {
          const Icon = kpi.icon;
          const colors = colorClasses[kpi.color];
          return (
            <Card key={kpi.title} className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p className={cn(
                      "text-xs font-medium",
                      kpi.change > 0 ? "text-success" : "text-destructive"
                    )}>
                      {kpi.change > 0 ? '↑' : '↓'} {Math.abs(kpi.change)}% vs mês anterior
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
        <ModuleKPISection
          title="Comercial"
          icon={ShoppingCart}
          kpis={commercialKPIs}
          accentColor="bg-primary"
        />
        <ModuleKPISection
          title="Financeiro"
          icon={Wallet}
          kpis={financialKPIs}
          accentColor="bg-success"
        />
        <ModuleKPISection
          title="Estoque"
          icon={Package}
          kpis={inventoryKPIs}
          accentColor="bg-info"
        />
        <ModuleKPISection
          title="WMS"
          icon={Warehouse}
          kpis={wmsKPIs}
          accentColor="bg-warning"
        />
        <ModuleKPISection
          title="Produção"
          icon={Factory}
          kpis={productionKPIs}
          accentColor="bg-[hsl(142,76%,36%)]"
        />
        <ModuleKPISection
          title="Compras"
          icon={Truck}
          kpis={purchasingKPIs}
          accentColor="bg-[hsl(262,83%,58%)]"
        />
      </div>

      {/* Gráficos Consolidados */}
      <ConsolidatedCharts
        modulePerformance={modulePerformance}
        statusDistribution={statusDistribution}
      />

      {/* Alertas + Faturamento + Atividades */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlobalAlerts alerts={globalAlerts} />
        <RevenueChart />
        <RecentActivities />
      </div>
    </div>
  );
}
