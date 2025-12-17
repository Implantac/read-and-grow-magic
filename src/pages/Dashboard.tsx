import { useAppStore } from '@/stores/useAppStore';
import { mockKPIs } from '@/data/mockData';
import { KPICard } from '@/components/dashboard/KPICard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { SalesByCategoryChart } from '@/components/dashboard/SalesByCategoryChart';
import { OrderStatusChart } from '@/components/dashboard/OrderStatusChart';
import { AlertsTable } from '@/components/dashboard/AlertsTable';
import { RecentActivities } from '@/components/dashboard/RecentActivities';

export default function Dashboard() {
  const { user, activeCompany, activeBranch } = useAppStore();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {user?.name}! • {activeCompany?.name} - {activeBranch?.name}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {mockKPIs.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <RevenueChart />
        <OrderStatusChart />
      </div>

      {/* Charts Row 2 + Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <SalesByCategoryChart />
        <AlertsTable />
        <RecentActivities />
      </div>
    </div>
  );
}
