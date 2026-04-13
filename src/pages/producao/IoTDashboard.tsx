import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useProductionMachines } from '@/hooks/useProductionMachines';
import { useProductionCapacity } from '@/hooks/useProductionCapacity';
import { useProductionOrders } from '@/hooks/useProductionOrders';
import { Activity, Cpu, Wifi, WifiOff, Thermometer, Gauge, Zap, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Simulated IoT telemetry generator
function generateTelemetry(machineId: string, status: string) {
  const isRunning = status === 'running';
  return {
    machineId,
    temperature: isRunning ? 45 + Math.random() * 30 : 20 + Math.random() * 5,
    vibration: isRunning ? 0.5 + Math.random() * 2.5 : Math.random() * 0.2,
    power: isRunning ? 3 + Math.random() * 7 : 0.1 + Math.random() * 0.3,
    rpm: isRunning ? 800 + Math.random() * 1200 : 0,
    uptime: Math.random() * 100,
    connected: true,
    lastPing: new Date().toISOString(),
  };
}

export default function IoTDashboard() {
  const { machines } = useProductionMachines();
  const { capacities } = useProductionCapacity();
  const { orders } = useProductionOrders();
  const [telemetryData, setTelemetryData] = useState<Record<string, any>>({});
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Simulate real-time telemetry updates
  useEffect(() => {
    const updateTelemetry = () => {
      const data: Record<string, any> = {};
      machines.forEach(m => {
        data[m.id] = generateTelemetry(m.id, m.status);
      });
      setTelemetryData(data);
      setLastRefresh(new Date());

      // Add to historical
      setHistoricalData(prev => {
        const point = {
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          avgTemp: Object.values(data).reduce((s: number, d: any) => s + d.temperature, 0) / Math.max(Object.keys(data).length, 1),
          avgPower: Object.values(data).reduce((s: number, d: any) => s + d.power, 0) / Math.max(Object.keys(data).length, 1),
          avgVibration: Object.values(data).reduce((s: number, d: any) => s + d.vibration, 0) / Math.max(Object.keys(data).length, 1),
          machinesRunning: machines.filter(m => m.status === 'running').length,
        };
        const next = [...prev, point];
        return next.slice(-30);
      });
    };

    updateTelemetry();
    const interval = setInterval(updateTelemetry, 5000);
    return () => clearInterval(interval);
  }, [machines]);

  const connectedCount = Object.values(telemetryData).filter((t: any) => t.connected).length;
  const runningCount = machines.filter(m => m.status === 'running').length;
  const alertCount = Object.values(telemetryData).filter((t: any) => t.temperature > 70 || t.vibration > 2.5).length;
  const avgEfficiency = capacities.length > 0 ? capacities.reduce((s, c) => s + (100 - c.current_load_pct), 0) / capacities.length : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'available': return 'bg-blue-500';
      case 'stopped': return 'bg-yellow-500';
      case 'maintenance': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running': return 'Operando';
      case 'available': return 'Disponível';
      case 'stopped': return 'Parada';
      case 'maintenance': return 'Manutenção';
      default: return status;
    }
  };

  const getTempAlert = (temp: number) => {
    if (temp > 70) return { color: 'text-red-500', label: 'CRÍTICA' };
    if (temp > 55) return { color: 'text-yellow-500', label: 'Alta' };
    return { color: 'text-green-500', label: 'Normal' };
  };

  return (
    <PageContainer>
      <PageHeader
        title="🌐 IoT — Monitoramento em Tempo Real"
        description="Coleta automática de dados, telemetria e monitoramento de máquinas"
      />

      {/* Live Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Conectadas</p>
                <p className="text-2xl font-bold">{connectedCount}/{machines.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Operando</p>
                <p className="text-2xl font-bold">{runningCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Alertas</p>
                <p className="text-2xl font-bold">{alertCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Capacidade Livre</p>
                <p className="text-2xl font-bold">{avgEfficiency.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Atualização em tempo real — último refresh: {lastRefresh.toLocaleTimeString('pt-BR')}
      </div>

      <Tabs defaultValue="machines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="machines">Máquinas</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetria</TabsTrigger>
          <TabsTrigger value="alerts">Alertas IoT</TabsTrigger>
        </TabsList>

        <TabsContent value="machines">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map(machine => {
              const telemetry = telemetryData[machine.id];
              const tempAlert = telemetry ? getTempAlert(telemetry.temperature) : null;

              return (
                <Card key={machine.id} className="relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusColor(machine.status)}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{machine.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {telemetry?.connected ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-destructive" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {getStatusLabel(machine.status)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{machine.code} • {machine.sector || 'Sem setor'}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {telemetry ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <Thermometer className={`h-4 w-4 ${tempAlert?.color}`} />
                            <div>
                              <p className="text-xs text-muted-foreground">Temp.</p>
                              <p className="text-sm font-semibold">{telemetry.temperature.toFixed(1)}°C</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Vibração</p>
                              <p className="text-sm font-semibold">{telemetry.vibration.toFixed(2)} mm/s</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">Energia</p>
                              <p className="text-sm font-semibold">{telemetry.power.toFixed(1)} kW</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-purple-500" />
                            <div>
                              <p className="text-xs text-muted-foreground">RPM</p>
                              <p className="text-sm font-semibold">{telemetry.rpm.toFixed(0)}</p>
                            </div>
                          </div>
                        </div>

                        {machine.current_operator && (
                          <p className="text-xs text-muted-foreground">
                            Operador: <span className="font-medium text-foreground">{machine.current_operator}</span>
                          </p>
                        )}

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Carga</span>
                            <span>{machine.capacity_per_hour} un/h</span>
                          </div>
                          <Progress value={machine.status === 'running' ? 60 + Math.random() * 30 : 0} className="h-2" />
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">Aguardando dados...</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {machines.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                Nenhuma máquina cadastrada. Cadastre máquinas no módulo de Capacidade.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="telemetry">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Temperatura Média (últimos 2.5 min)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Area type="monotone" dataKey="avgTemp" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive)/0.2)" name="Temp °C" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Consumo Energético (kW)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Area type="monotone" dataKey="avgPower" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" name="Energia kW" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Vibração Média (mm/s)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgVibration" stroke="hsl(var(--accent-foreground))" name="Vibração" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Máquinas Operando</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" className="text-xs" />
                    <YAxis className="text-xs" allowDecimals={false} />
                    <Tooltip />
                    <Area type="stepAfter" dataKey="machinesRunning" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2)/0.3)" name="Em operação" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                {machines.map(machine => {
                  const telemetry = telemetryData[machine.id];
                  if (!telemetry) return null;
                  const alerts: { type: string; msg: string; severity: string }[] = [];
                  if (telemetry.temperature > 70) alerts.push({ type: 'temp', msg: `Temperatura crítica: ${telemetry.temperature.toFixed(1)}°C`, severity: 'critical' });
                  else if (telemetry.temperature > 55) alerts.push({ type: 'temp', msg: `Temperatura elevada: ${telemetry.temperature.toFixed(1)}°C`, severity: 'warning' });
                  if (telemetry.vibration > 2.5) alerts.push({ type: 'vibration', msg: `Vibração excessiva: ${telemetry.vibration.toFixed(2)} mm/s`, severity: 'critical' });
                  if (!telemetry.connected) alerts.push({ type: 'conn', msg: 'Sem conexão', severity: 'critical' });

                  if (alerts.length === 0) return null;

                  return alerts.map((alert, i) => (
                    <div key={`${machine.id}-${i}`} className={`flex items-center gap-3 p-3 rounded-lg border ${alert.severity === 'critical' ? 'border-destructive/50 bg-destructive/5' : 'border-yellow-500/50 bg-yellow-500/5'}`}>
                      <AlertTriangle className={`h-5 w-5 ${alert.severity === 'critical' ? 'text-destructive' : 'text-yellow-500'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{machine.name} ({machine.code})</p>
                        <p className="text-xs text-muted-foreground">{alert.msg}</p>
                      </div>
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                        {alert.severity === 'critical' ? 'Crítico' : 'Atenção'}
                      </Badge>
                    </div>
                  ));
                })}

                {alertCount === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>Nenhum alerta ativo. Todas as máquinas operam normalmente.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
