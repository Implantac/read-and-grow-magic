import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/base/tabs';
import { useProductionMachines } from '@/hooks/production/useProductionMachines';
import { RefreshCw } from 'lucide-react';
import { useTelemetry } from './iot/telemetry';
import { IoTKPICards } from './iot/IoTKPICards';
import { MachinesTab } from './iot/MachinesTab';
import { PredictiveTab } from './iot/PredictiveTab';
import { TelemetryTab } from './iot/TelemetryTab';
import { EnergyTab } from './iot/EnergyTab';
import { AlertsTab } from './iot/AlertsTab';

export default function IoTDashboard() {
  const { machines } = useProductionMachines();
  const { telemetryData, historicalData, lastRefresh } = useTelemetry(machines);

  const allTelemetry = Object.entries(telemetryData);
  const connectedCount = allTelemetry.filter(([, t]) => t.connected).length;
  const runningCount = machines.filter(m => m.status === 'running').length;
  const alertCount = allTelemetry.filter(([, t]) => t.predictiveAlert).length;
  const avgHealth = allTelemetry.length > 0 ? allTelemetry.reduce((s, [, t]) => s + t.healthScore, 0) / allTelemetry.length : 0;
  const totalEnergy = allTelemetry.reduce((s, [, t]) => s + t.power, 0);
  const avgMTBF = allTelemetry.length > 0 ? allTelemetry.reduce((s, [, t]) => s + t.mtbf, 0) / allTelemetry.length : 0;
  const avgEfficiency = allTelemetry.length > 0 ? allTelemetry.reduce((s, [, t]) => s + t.energyEfficiency, 0) / allTelemetry.length : 0;

  const machinesList = machines.map(m => ({ ...m, telemetry: telemetryData[m.id] }));

  return (
    <PageContainer>
      <PageHeader title="🌐 IoT — Monitoramento Industrial em Tempo Real" description="Telemetria, manutenção preditiva, MTBF/MTTR, eficiência energética e saúde das máquinas" />

      <IoTKPICards
        connectedCount={connectedCount}
        totalMachines={machines.length}
        runningCount={runningCount}
        alertCount={alertCount}
        avgHealth={avgHealth}
        totalEnergy={totalEnergy}
        avgMTBF={avgMTBF}
      />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Atualização em tempo real — {lastRefresh.toLocaleTimeString('pt-BR')}
      </div>

      <Tabs defaultValue="machines" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="machines">🏭 Máquinas</TabsTrigger>
          <TabsTrigger value="predictive">🔮 Manutenção Preditiva</TabsTrigger>
          <TabsTrigger value="telemetry">📊 Telemetria</TabsTrigger>
          <TabsTrigger value="energy">⚡ Energia</TabsTrigger>
          <TabsTrigger value="alerts">🚨 Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="machines"><MachinesTab machinesList={machinesList} /></TabsContent>
        <TabsContent value="predictive"><PredictiveTab machinesList={machinesList} /></TabsContent>
        <TabsContent value="telemetry"><TelemetryTab historicalData={historicalData} /></TabsContent>
        <TabsContent value="energy"><EnergyTab machinesList={machinesList} totalEnergy={totalEnergy} runningCount={runningCount} avgEfficiency={avgEfficiency} /></TabsContent>
        <TabsContent value="alerts"><AlertsTab machinesList={machinesList} /></TabsContent>
      </Tabs>
    </PageContainer>
  );
}
