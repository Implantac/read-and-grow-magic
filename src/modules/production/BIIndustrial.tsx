import { useState } from 'react';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/base/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { useBIMetrics } from './bi/useBIMetrics';
import { BIScorecards } from './bi/BIScorecards';
import { ExecutiveTab } from './bi/ExecutiveTab';
import { ParetoTab } from './bi/ParetoTab';
import { ProfitTab } from './bi/ProfitTab';
import { CostTab } from './bi/CostTab';
import { OEETab } from './bi/OEETab';
import { TrendTab } from './bi/TrendTab';
import { StrategicTab } from './bi/StrategicTab';

export default function BIIndustrialPage() {
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const periodDays = Number(period);
  const metrics = useBIMetrics(periodDays);

  return (
    <PageContainer>
      <PageHeader title="📊 BI Industrial — Enterprise" description="Business Intelligence estratégico: Pareto, indicadores, custos e eficiência produtiva">
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={v => setPeriod(v as any)}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <BIScorecards metrics={metrics} />

      <Tabs defaultValue="executive" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="executive">📈 Executivo</TabsTrigger>
          <TabsTrigger value="pareto">🏆 Pareto ABC</TabsTrigger>
          <TabsTrigger value="profit">💰 Lucro por Produto</TabsTrigger>
          <TabsTrigger value="cost">🏭 Custo por Processo</TabsTrigger>
          <TabsTrigger value="oee">⚙️ OEE</TabsTrigger>
          <TabsTrigger value="trend">📊 Tendências</TabsTrigger>
          <TabsTrigger value="strategic">🎯 Indicadores Estratégicos</TabsTrigger>
        </TabsList>

        <TabsContent value="executive">
          <ExecutiveTab metrics={metrics} period={period} periodDays={periodDays} />
        </TabsContent>
        <TabsContent value="pareto">
          <ParetoTab metrics={metrics} />
        </TabsContent>
        <TabsContent value="profit">
          <ProfitTab metrics={metrics} />
        </TabsContent>
        <TabsContent value="cost">
          <CostTab metrics={metrics} />
        </TabsContent>
        <TabsContent value="oee">
          <OEETab metrics={metrics} />
        </TabsContent>
        <TabsContent value="trend">
          <TrendTab metrics={metrics} period={period} periodDays={periodDays} />
        </TabsContent>
        <TabsContent value="strategic">
          <StrategicTab metrics={metrics} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
