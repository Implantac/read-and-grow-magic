import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/PageLoading';
import { KPICard } from '@/shared/components/KPICard';
import { useTMS } from '@/hooks/operational/useTMSQuery';
import { useMemo } from 'react';
import { Truck, Building2, MapPin, PackageCheck, Navigation, Clock } from 'lucide-react';

const TMSDashboard = () => {
  const { carriers, carriersLoading, vehicles, vehiclesLoading, routes, routesLoading, proofs, proofsLoading } = useTMS();
  
  const loading = carriersLoading || vehiclesLoading || routesLoading || proofsLoading;

  const stats = useMemo(() => ({
    activeCarriers: carriers.filter(c => c.active).length,
    availableVehicles: vehicles.filter(v => v.status === 'available').length,
    totalVehicles: vehicles.length,
    plannedRoutes: routes.filter(r => r.status === 'planned').length,
    inTransitRoutes: routes.filter(r => r.status === 'in_transit').length,
    pendingDeliveries: proofs.filter(p => p.status === 'pending').length,
    deliveredCount: proofs.filter(p => p.status === 'delivered').length,
  }), [carriers, vehicles, routes, proofs]);

  if (loading) return <PageLoading />;

  const kpis = [
    { title: 'Transportadoras Ativas', value: stats.activeCarriers, icon: <Building2 className="h-5 w-5" />, color: 'primary' },
    { title: 'Veículos Disponíveis', value: `${stats.availableVehicles}/${stats.totalVehicles}`, icon: <Truck className="h-5 w-5" />, color: 'info' },
    { title: 'Rotas Planejadas', value: stats.plannedRoutes, icon: <MapPin className="h-5 w-5" />, color: 'warning' },
    { title: 'Em Trânsito', value: stats.inTransitRoutes, icon: <Navigation className="h-5 w-5" />, color: 'success' },
    { title: 'Entregas Pendentes', value: stats.pendingDeliveries, icon: <Clock className="h-5 w-5" />, color: 'danger' },
    { title: 'Entregas Realizadas', value: stats.deliveredCount, icon: <PackageCheck className="h-5 w-5" />, color: 'success' },
  ];

  return (
    <PageContainer>
      <PageHeader title="TMS - Gestão de Transporte" description="Painel de controle de transportadoras, rotas e entregas" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} accentColor={kpi.color} index={i} />
        ))}
      </div>
    </PageContainer>
  );
};

export default TMSDashboard;
