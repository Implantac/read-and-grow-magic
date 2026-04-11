import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageLoading } from '@/components/shared/PageLoading';
import { KPICard } from '@/components/shared/KPICard';
import { useTMSDashboardStats } from '@/hooks/useTMS';
import { Truck, Building2, MapPin, PackageCheck, Navigation, Clock } from 'lucide-react';

const TMSDashboard = () => {
  const { stats, loading } = useTMSDashboardStats();

  if (loading) return <PageLoading />;

  const kpis = [
    { title: 'Transportadoras Ativas', value: stats.activeCarriers, icon: Building2, color: 'primary' as const },
    { title: 'Veículos Disponíveis', value: `${stats.availableVehicles}/${stats.totalVehicles}`, icon: Truck, color: 'info' as const },
    { title: 'Rotas Planejadas', value: stats.plannedRoutes, icon: MapPin, color: 'warning' as const },
    { title: 'Em Trânsito', value: stats.inTransitRoutes, icon: Navigation, color: 'success' as const },
    { title: 'Entregas Pendentes', value: stats.pendingDeliveries, icon: Clock, color: 'destructive' as const },
    { title: 'Entregas Realizadas', value: stats.deliveredCount, icon: PackageCheck, color: 'success' as const },
  ];

  return (
    <PageContainer>
      <PageHeader title="TMS - Gestão de Transporte" description="Painel de controle de transportadoras, rotas e entregas" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} color={kpi.color} index={i} />
        ))}
      </div>
    </PageContainer>
  );
};

export default TMSDashboard;
