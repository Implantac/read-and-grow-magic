import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Skeleton } from '@/ui/base/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { CanalFilter } from '@/components/shared/CanalFilter';
import { usePerformanceData } from './performanceDashboard/usePerformanceData';
import { KPIRow } from './performanceDashboard/KPIRow';
import { RankingTab } from './performanceDashboard/RankingTab';
import { ConversionTab } from './performanceDashboard/ConversionTab';
import { LostSalesTab } from './performanceDashboard/LostSalesTab';

export default function PerformanceDashboard() {
  const { loading, performances, lostAlerts, globalStats, funnelConversion } = usePerformanceData();

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Performance Comercial" description="Indicadores de desempenho da equipe" />
        <div className="grid gap-4 md:grid-cols-4 mt-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <PageHeader title="Performance Comercial" description="Análise completa do desempenho da equipe e indicadores de conversão" />
        <CanalFilter />
      </div>

      <KPIRow globalStats={globalStats} lostAlertsCount={lostAlerts.length} />

      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ranking">🏆 Ranking Vendedores</TabsTrigger>
          <TabsTrigger value="conversion">📊 Conversão do Funil</TabsTrigger>
          <TabsTrigger value="lost">🚨 Vendas Perdidas ({lostAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking">
          <RankingTab performances={performances} />
        </TabsContent>

        <TabsContent value="conversion">
          <ConversionTab funnelConversion={funnelConversion} />
        </TabsContent>

        <TabsContent value="lost" className="space-y-4">
          <LostSalesTab lostAlerts={lostAlerts} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
